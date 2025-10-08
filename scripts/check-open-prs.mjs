#!/usr/bin/env node
import process from 'node:process';
import { stdout, stderr } from 'node:process';

const args = process.argv.slice(2);
let repoSlug = null;
let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
let state = 'open';
let page = 1;
let perPage = 30;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  switch (arg) {
    case '--repo':
    case '-r': {
      const next = args[i + 1];
      if (!next) {
        stderr.write('Error: --repo requires an argument in the form owner/name.\n');
        process.exit(1);
      }
      repoSlug = next;
      i += 1;
      break;
    }
    case '--token':
    case '-t': {
      const next = args[i + 1];
      if (!next) {
        stderr.write('Error: --token requires a GitHub personal access token value.\n');
        process.exit(1);
      }
      token = next;
      i += 1;
      break;
    }
    case '--state': {
      const next = args[i + 1];
      if (!next || !['open', 'closed', 'all'].includes(next)) {
        stderr.write('Error: --state must be one of: open, closed, all.\n');
        process.exit(1);
      }
      state = next;
      i += 1;
      break;
    }
    case '--per-page': {
      const next = args[i + 1];
      const parsed = Number.parseInt(next, 10);
      if (!next || Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        stderr.write('Error: --per-page must be an integer between 1 and 100.\n');
        process.exit(1);
      }
      perPage = parsed;
      i += 1;
      break;
    }
    case '--page': {
      const next = args[i + 1];
      const parsed = Number.parseInt(next, 10);
      if (!next || Number.isNaN(parsed) || parsed < 1) {
        stderr.write('Error: --page must be a positive integer.\n');
        process.exit(1);
      }
      page = parsed;
      i += 1;
      break;
    }
    case '--help':
    case '-h': {
      printHelp();
      process.exit(0);
    }
    default: {
      stderr.write(`Unknown argument: ${arg}\n`);
      printHelp();
      process.exit(1);
    }
  }
}

if (!repoSlug) {
  stderr.write('Error: Missing required --repo argument.\n');
  printHelp();
  process.exit(1);
}

if (!repoSlug.includes('/')) {
  stderr.write('Error: --repo must be in the form owner/name.\n');
  process.exit(1);
}

const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'maku-travel-verse-pr-checker',
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

const endpoint = new URL(`https://api.github.com/repos/${repoSlug}/pulls`);
endpoint.searchParams.set('state', state);
endpoint.searchParams.set('per_page', String(perPage));
endpoint.searchParams.set('page', String(page));

const paginationNotice = (linkHeader) => {
  if (!linkHeader) return null;
  const segments = linkHeader.split(',');
  const rels = new Map();
  for (const segment of segments) {
    const match = segment.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (!match) continue;
    rels.set(match[2], match[1]);
  }
  if (rels.has('next')) {
    return `⚠️ Additional pages available (next: ${rels.get('next')}).`;
  }
  return null;
};

async function main() {
  try {
    const response = await fetch(endpoint, { headers });
    if (response.status === 401) {
      stderr.write('Error: Unauthorized. Provide a valid GitHub token via --token or GITHUB_TOKEN.\n');
      process.exit(1);
    }
    if (response.status === 404) {
      stderr.write('Error: Repository not found. Double-check the --repo value.\n');
      process.exit(1);
    }
    if (!response.ok) {
      const bodyText = await response.text();
      stderr.write(`GitHub API request failed with status ${response.status}. Body: ${bodyText}\n`);
      process.exit(1);
    }

    const pulls = await response.json();
    if (!Array.isArray(pulls)) {
      stderr.write('Error: Unexpected response payload from GitHub API.\n');
      process.exit(1);
    }

    if (pulls.length === 0) {
      stdout.write('No pull requests match the specified filters.\n');
    } else {
      for (const pr of pulls) {
        const labels = Array.isArray(pr.labels)
          ? pr.labels
              .map((label) => (typeof label === 'object' && label !== null ? label.name : label))
              .filter(Boolean)
          : [];
        const labelStr = labels.length > 0 ? ` [labels: ${labels.join(', ')}]` : '';
        stdout.write(`#${pr.number} ${pr.title}${labelStr}\n`);
        stdout.write(`  ${pr.head?.ref ?? 'unknown'} -> ${pr.base?.ref ?? 'unknown'}\n`);
        stdout.write(`  Updated: ${pr.updated_at}\n`);
        stdout.write(`  URL: ${pr.html_url}\n`);
        if (pr.draft) {
          stdout.write('  Status: Draft\n');
        }
        stdout.write('\n');
      }
    }

    const notice = paginationNotice(response.headers.get('link'));
    if (notice) {
      stdout.write(`${notice}\n`);
    }
  } catch (error) {
    stderr.write(`Unexpected error: ${error.message}\n`);
    process.exit(1);
  }
}

function printHelp() {
  stdout.write(`Usage: node scripts/check-open-prs.mjs --repo <owner/name> [options]\n\n`);
  stdout.write('Options:\n');
  stdout.write('  --repo, -r <owner/name>   Repository slug (required)\n');
  stdout.write('  --token, -t <token>       GitHub token (optional, default uses GITHUB_TOKEN env var)\n');
  stdout.write('  --state <state>           Pull request state filter: open, closed, all (default: open)\n');
  stdout.write('  --per-page <n>            Results per page (1-100, default: 30)\n');
  stdout.write('  --page <n>                Page number to retrieve (default: 1)\n');
  stdout.write('  --help, -h                Show this help message\n');
}

await main();
