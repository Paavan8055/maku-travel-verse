#!/usr/bin/env node
// Quick local secret scan (heuristic). Exits non-zero if matches found.
import { execSync } from 'child_process';

try {
  const cmd = `git grep -I --line-number -n "SUPABASE_SERVICE_ROLE_KEY\\|STRIPE_SECRET_KEY\\|SECRET_KEY\\|PRIVATE_KEY\\|AWS_SECRET_ACCESS_KEY\\|BEGIN PRIVATE KEY" || true`;
  const out = execSync(cmd, { encoding: 'utf8' });
  if (out && out.trim()) {
    console.error('Potential secret literals found:');
    console.error(out);
    process.exit(1);
  }
  console.log('No obvious secret literals found by local quick-scan.');
} catch (e) {
  console.error('Error running local secret scan:', e.message);
  process.exit(2);
}
