import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import path from 'node:path';

const root = process.cwd();
const wrapper = path.join(root, 'scripts', 'prisma-env.mjs');

test('additive plan excludes only the named destructive migration', () => {
  const result = spawnSync(process.execPath, [wrapper, 'migrate', 'deploy', '--target=local', '--phase=additive', '--print-plan'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.phase, 'additive');
  assert.equal(plan.excludedMigration, '20260710030000_drop_dead_payment_cart_session_tables');
  assert.equal(plan.migrations.includes(plan.excludedMigration), false);
  assert.equal(plan.migrations.includes('20260710010000_database_hardening_additive'), true);
});

test('deploy refuses to run without an explicit phase', () => {
  const result = spawnSync(process.execPath, [wrapper, 'migrate', 'deploy', '--target=local'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /requires --phase=additive or --phase=complete/);
});
