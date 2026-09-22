#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const EXCLUDED_DESTRUCTIVE_MIGRATION = '20260710030000_drop_dead_payment_cart_session_tables';

function parseEnv(file) {
  const values = {};
  if (!existsSync(file)) return values;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    const doubleQuoted = value.startsWith('"') && value.endsWith('"');
    if (doubleQuoted || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
      if (doubleQuoted) {
        value = value
          .replaceAll('\\n', '\n')
          .replaceAll('\\r', '\r')
          .replaceAll('\\t', '\t')
          .replaceAll('\\"', '"')
          .replaceAll('\\\\', '\\');
      }
    }
    values[match[1]] = value;
  }
  return values;
}

const cliArgs = process.argv.slice(2);
const isMigrationCommand = cliArgs[0] === 'migrate';
const isDeployCommand = isMigrationCommand && cliArgs[1] === 'deploy';
const optionValue = (name) => {
  const inline = cliArgs.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = cliArgs.indexOf(name);
  return index >= 0 ? cliArgs[index + 1] : undefined;
};

let tempSchemaDir;

async function createAdditiveSchema() {
  const sourcePrismaDir = path.join(process.cwd(), 'prisma');
  const sourceMigrationsDir = path.join(sourcePrismaDir, 'migrations');
  tempSchemaDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'phenofarm-prisma-additive-'));
  const targetMigrationsDir = path.join(tempSchemaDir, 'migrations');
  await fsPromises.mkdir(targetMigrationsDir, { recursive: true });
  await fsPromises.cp(path.join(sourcePrismaDir, 'schema.prisma'), path.join(tempSchemaDir, 'schema.prisma'));
  for (const entry of await fsPromises.readdir(sourceMigrationsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === EXCLUDED_DESTRUCTIVE_MIGRATION) continue;
    await fsPromises.cp(path.join(sourceMigrationsDir, entry.name), path.join(targetMigrationsDir, entry.name), { recursive: true });
  }
  return path.join(tempSchemaDir, 'schema.prisma');
}

async function main() {
  if (isMigrationCommand) {
    const target = optionValue('--target');
    const envFileArg = optionValue('--env-file');
    const expectedHost = optionValue('--expected-host')?.toLowerCase();
    const expectedDatabase = optionValue('--expected-database');
    const phase = optionValue('--phase');
    const printPlan = cliArgs.includes('--print-plan');
    const confirmProduction = cliArgs.includes('--confirm-production');
    const confirmTarget = cliArgs.includes('--confirm-target');
    for (const [name, value] of [['--env-file', envFileArg], ['--expected-host', expectedHost], ['--expected-database', expectedDatabase], ['--phase', phase]]) {
      if (cliArgs.includes(name) && (!value || value.startsWith('--'))) {
        throw new Error(`${name} requires a value.`);
      }
    }
    if (!['local', 'rehearsal', 'production', 'explicit'].includes(target)) {
      throw new Error('Prisma migration target is required. Use --target=local, --target=rehearsal, --target=production, or --target=explicit.');
    }
    if (isDeployCommand && !['additive', 'complete'].includes(phase)) {
      throw new Error('Prisma migrate deploy requires --phase=additive or --phase=complete.');
    }
    if (printPlan && (!isDeployCommand || phase !== 'additive')) {
      throw new Error('--print-plan is only available for --phase=additive.');
    }
    if (target === 'production' && !confirmProduction) {
      throw new Error('Production Prisma migrations require --confirm-production. No database changes were made.');
    }
    if ((target === 'rehearsal' || target === 'explicit') && !confirmTarget) {
      throw new Error('Rehearsal or explicit-target Prisma migrations require --confirm-target. No database changes were made.');
    }
    if (target !== 'local' && (!expectedHost || !expectedDatabase)) {
      throw new Error(`--target=${target} requires --expected-host and --expected-database.`);
    }
    if (target === 'rehearsal' && !envFileArg) {
      throw new Error('--target=rehearsal requires --env-file=/path/to/rehearsal.env.');
    }

    const envFile = envFileArg || (target === 'local'
      ? path.join(process.cwd(), '.env.local')
      : target === 'production'
        ? path.join(process.cwd(), '.env.production')
        : null);
    const values = envFile ? parseEnv(envFile) : {};
    const databaseUrl = values.DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error(`DATABASE_URL is missing for --target=${target}. No database changes were made.`);

    let parsed;
    try {
      parsed = new URL(databaseUrl);
    } catch {
      throw new Error('Invalid DATABASE_URL. No database changes were made.');
    }
    const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    const localHost = ['localhost', '127.0.0.1', '::1'].includes(host);
    if ((target === 'local' && !localHost) || (target !== 'local' && localHost)) {
      throw new Error(`DATABASE_URL host does not match --target=${target}. No database changes were made.`);
    }
    if (target !== 'local' && (host !== expectedHost || decodeURIComponent(parsed.pathname.replace(/^\//, '')) !== expectedDatabase)) {
      throw new Error(`DATABASE_URL does not match the expected host/database for --target=${target}. No database changes were made.`);
    }
    for (const [key, value] of Object.entries(values)) process.env[key] = value;
    process.env.DATABASE_URL = databaseUrl;

    if (isDeployCommand && phase === 'additive') {
      await createAdditiveSchema();
      if (printPlan) {
        const migrationEntries = (await fsPromises.readdir(path.join(tempSchemaDir, 'migrations'), { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort();
        console.log(JSON.stringify({ phase, excludedMigration: EXCLUDED_DESTRUCTIVE_MIGRATION, migrations: migrationEntries }, null, 2));
        return;
      }
    }
  }

  const prismaArgs = cliArgs.filter((arg, index) => {
    if (['--confirm-production', '--confirm-target'].includes(arg)) return false;
    if (['--target', '--env-file', '--expected-host', '--expected-database', '--phase'].includes(arg)) return false;
    if (index > 0 && ['--target', '--env-file', '--expected-host', '--expected-database', '--phase'].includes(cliArgs[index - 1])) return false;
    if (arg.startsWith('--target=') || arg.startsWith('--env-file=') || arg.startsWith('--expected-host=') || arg.startsWith('--expected-database=') || arg.startsWith('--phase=')) return false;
    if (arg === '--print-plan') return false;
    if (isDeployCommand && arg === '--schema') return false;
    return true;
  });
  if (isDeployCommand && optionValue('--phase') === 'additive') {
    prismaArgs.push('--schema', path.join(tempSchemaDir, 'schema.prisma'));
  }
  const result = spawnSync('npx', ['prisma', ...prismaArgs], {
    stdio: 'inherit',
    env: process.env,
  });
  process.exitCode = result.status ?? 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (tempSchemaDir) await fsPromises.rm(tempSchemaDir, { recursive: true, force: true });
  });
