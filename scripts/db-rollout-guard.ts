import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type RolloutTarget = 'local' | 'rehearsal' | 'production' | 'explicit';

export interface RolloutOptions {
  target: RolloutTarget;
  dryRun: boolean;
  confirmProduction: boolean;
  confirmTarget: boolean;
  confirmLocal: boolean;
  envFile?: string;
  expectedHost?: string;
  expectedDatabase?: string;
  backupFile?: string;
}

interface ParseOptions {
  mutating: boolean;
  allowDryRun?: boolean;
  requireLocalConfirmation?: boolean;
}

interface LoadedEnvironment {
  target: RolloutTarget;
  envFile: string;
  host: string;
  database: string;
}

function parseEnvFile(filePath: string) {
  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
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

function optionValue(argv: string[], name: string) {
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

export function parseRolloutArgs(argv = process.argv.slice(2), options: ParseOptions): RolloutOptions {
  const targetValue = optionValue(argv, '--target');
  if (targetValue !== 'local' && targetValue !== 'rehearsal' && targetValue !== 'production' && targetValue !== 'explicit') {
    throw new Error('A target is required. Use --target=local, --target=rehearsal, --target=production, or --target=explicit.');
  }

  const target = targetValue;
  const dryRun = argv.includes('--dry-run');
  const confirmProduction = argv.includes('--confirm-production');
  const confirmTarget = argv.includes('--confirm-target');
  const confirmLocal = argv.includes('--confirm-local');
  const backupFile = optionValue(argv, '--backup-file');
  const envFile = optionValue(argv, '--env-file');
  const expectedHost = optionValue(argv, '--expected-host')?.toLowerCase();
  const expectedDatabase = optionValue(argv, '--expected-database');
  if (argv.includes('--backup-file') && (!backupFile || backupFile.startsWith('--'))) {
    throw new Error('--backup-file requires a path.');
  }
  if (argv.includes('--env-file') && (!envFile || envFile.startsWith('--'))) {
    throw new Error('--env-file requires a path.');
  }
  if (argv.includes('--expected-host') && (!expectedHost || expectedHost.startsWith('--'))) {
    throw new Error('--expected-host requires a hostname.');
  }
  if (argv.includes('--expected-database') && (!expectedDatabase || expectedDatabase.startsWith('--'))) {
    throw new Error('--expected-database requires a database name.');
  }

  if (dryRun && !options.allowDryRun) {
    throw new Error('This operation does not support --dry-run.');
  }
  if (options.mutating && !dryRun && target === 'production' && !confirmProduction) {
    throw new Error('Production mutations require --confirm-production. No database changes were made.');
  }
  if (options.mutating && !dryRun && (target === 'rehearsal' || target === 'explicit') && !confirmTarget) {
    throw new Error('Rehearsal or explicit-target mutations require --confirm-target. No database changes were made.');
  }
  if (options.requireLocalConfirmation && !dryRun && target === 'local' && !confirmLocal) {
    throw new Error('Local cleanup requires --confirm-local. No database changes were made.');
  }

  const recognized = new Set([
    '--dry-run',
    '--confirm-production',
    '--confirm-target',
    '--confirm-local',
    '--target',
    '--backup-file',
    '--env-file',
    '--expected-host',
    '--expected-database',
  ]);
  const unexpected = argv.filter((arg, index) => {
    if (arg.startsWith('--target=')) return false;
    if (arg.startsWith('--backup-file=')) return false;
    if (arg.startsWith('--env-file=')) return false;
    if (arg.startsWith('--expected-host=')) return false;
    if (arg.startsWith('--expected-database=')) return false;
    if (recognized.has(arg)) return false;
    if (index > 0 && ['--target', '--backup-file', '--env-file', '--expected-host', '--expected-database'].includes(argv[index - 1])) return false;
    return true;
  });
  if (unexpected.length) {
    throw new Error(`Unknown rollout option(s): ${unexpected.join(', ')}`);
  }

  if (target === 'rehearsal' && !envFile) {
    throw new Error('--target=rehearsal requires --env-file=/path/to/rehearsal.env.');
  }
  if ((target === 'rehearsal' || target === 'production' || target === 'explicit') && (!expectedHost || !expectedDatabase)) {
    throw new Error(`${target} requires --expected-host and --expected-database.`);
  }

  const selectedEnvFile = envFile || (target === 'local' ? path.join(process.cwd(), '.env.local') : target === 'production' ? path.join(process.cwd(), '.env.production') : undefined);
  return { target, dryRun, confirmProduction, confirmTarget, confirmLocal, envFile: selectedEnvFile, expectedHost, expectedDatabase, backupFile };
}

export function loadRolloutEnvironment(options: RolloutOptions): LoadedEnvironment {
  const envLabel = options.envFile ? path.basename(options.envFile) : 'inherited DATABASE_URL';
  const fileValues = options.envFile
    ? (() => {
      if (!existsSync(options.envFile!)) {
        throw new Error(`Required environment file is missing: ${path.basename(options.envFile!)}. No database changes were made.`);
      }
      return parseEnvFile(options.envFile!);
    })()
    : {};
  const databaseUrl = (fileValues.DATABASE_URL || process.env.DATABASE_URL)?.trim();
  if (!databaseUrl) {
    throw new Error(`${envLabel} must define DATABASE_URL. No database changes were made.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(`${envLabel} contains an invalid DATABASE_URL. No database changes were made.`);
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (options.target === 'local' && !isLocalHost) {
    throw new Error(`--target=local requires a loopback DATABASE_URL host; got ${host}. No database changes were made.`);
  }
  if (options.target !== 'local' && isLocalHost) {
    throw new Error(`--target=${options.target} refuses a loopback DATABASE_URL host. No database changes were made.`);
  }
  if (options.expectedHost && options.expectedHost !== host) {
    throw new Error(`DATABASE_URL host does not match --expected-host for --target=${options.target}. No database changes were made.`);
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, '')) || '(default)';
  if (options.expectedDatabase && options.expectedDatabase !== database) {
    throw new Error(`DATABASE_URL database does not match --expected-database for --target=${options.target}. No database changes were made.`);
  }

  // The explicitly selected target file owns the database connection. This prevents
  // a stale shell DATABASE_URL or the old --env-file=.env.local script from winning.
  for (const [key, value] of Object.entries(fileValues)) process.env[key] = value;
  process.env.DATABASE_URL = databaseUrl;

  return {
    target: options.target,
    envFile: options.envFile ? path.basename(options.envFile) : '(inherited)',
    host,
    database,
  };
}

export function targetSummary(environment: LoadedEnvironment) {
  return {
    target: environment.target,
    envFile: environment.envFile,
    databaseHost: environment.host,
    database: environment.database,
  };
}
