#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const versionCheck = spawnSync('deno', ['--version'], { stdio: 'ignore' });
if (versionCheck.error || versionCheck.status !== 0) {
  console.warn('[test] Skipping Deno tests because `deno` is not available in this environment.');
  process.exit(0);
}

const denoTest = spawnSync('deno', ['test', '--allow-env', 'supabase/functions/**/index.test.ts'], {
  stdio: 'inherit',
});

if (denoTest.status !== 0) {
  process.exit(denoTest.status ?? 1);
}
