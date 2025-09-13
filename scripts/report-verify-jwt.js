#!/usr/bin/env node
// Simple analyzer for supabase/config.toml to report functions where verify_jwt = false
// Usage: node scripts/report-verify-jwt.js [path-to-config]

import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const configPath = process.argv[2] || path.join(__dirname, '..', 'supabase', 'config.toml');
if (!fs.existsSync(configPath)) {
  console.error('config.toml not found at', configPath);
  process.exit(2);
}

const content = fs.readFileSync(configPath, 'utf8');
const lines = content.split(/\r?\n/);

const results = [];
let currentSection = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  // match section headers like [functions.foo-bar]
  const m = line.match(/^\[functions\.(.+)\]$/);
  if (m) {
    currentSection = m[1];
    continue;
  }
  if (currentSection) {
    const v = line.match(/^verify_jwt\s*=\s*(true|false)/i);
    if (v) {
      const value = v[1].toLowerCase() === 'true';
      results.push({ function: currentSection, verify_jwt: value });
      currentSection = null;
      continue;
    }
    // If another section begins, reset
    if (/^\[.+\]$/.test(line)) {
      currentSection = null;
    }
  }
}

const insecure = results.filter(r => r.verify_jwt === false);
console.log('\nSupabase functions verify_jwt report:');
console.log('Total functions scanned:', results.length);
console.log('Functions with verify_jwt = false:', insecure.length);
if (insecure.length > 0) {
  console.log('\nList of functions that do not verify JWT:');
  insecure.forEach(f => console.log('- ' + f.function));
} else {
  console.log('\nAll scanned functions enforce verify_jwt = true (or not specified after section).');
}

// If CRITICAL_FUNCTIONS is set (comma-separated), fail with non-zero exit code when any critical function is insecure.
const criticalEnv = process.env.CRITICAL_FUNCTIONS || '';
if (criticalEnv.trim()) {
  const critical = criticalEnv.split(',').map(s => s.trim()).filter(Boolean);
  const foundCritical = insecure.filter(i => critical.includes(i.function));
  if (foundCritical.length > 0) {
    console.error('\nCRITICAL SECURITY FAILURE: The following critical functions do not verify JWT:');
    foundCritical.forEach(f => console.error('- ' + f.function));
    process.exit(1);
  } else {
    console.log('\nNo critical functions found among insecure functions.');
  }
}


