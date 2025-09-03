import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED_VERSION = '2.53.0';

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

const mismatches = [];

for (const file of walk('supabase/functions')) {
  if (!file.endsWith('.ts') && !file.endsWith('.json')) continue;
  const content = readFileSync(file, 'utf8');
  const regex = /@supabase\/supabase-js@([0-9\.]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const version = match[1];
    if (version !== REQUIRED_VERSION) {
      mismatches.push(`${file}: ${match[0]}`);
    }
  }
}

if (mismatches.length) {
  console.error('Found divergent @supabase/supabase-js versions:');
  for (const m of mismatches) {
    console.error(`  ${m}`);
  }
  process.exit(1);
}
