# Instructions: How to Merge and Close All Open Pull Requests

## ⚠️ Critical Limitation

**The Copilot coding agent cannot merge or close pull requests directly.** GitHub's PR merge and close operations require authentication and permissions that are not available through the GitHub MCP tools.

This document provides the exact commands you need to run to complete this task.

## Quick Start - Merge the Ready PRs

### Option 1: Using GitHub CLI (`gh`)

Install GitHub CLI if you haven't: https://cli.github.com/

```bash
# 1. Merge PR #57 (adds useful CLI tool for listing PRs)
gh pr merge 57 --squash --delete-branch --repo Paavan8055/maku-travel-verse

# 2. Close PR #58 (duplicate of #57, not needed)
gh pr close 58 --repo Paavan8055/maku-travel-verse
```

### Option 2: Using GitHub Web UI

1. Go to https://github.com/Paavan8055/maku-travel-verse/pull/57
2. Click "Squash and merge" button
3. Delete the branch after merging

4. Go to https://github.com/Paavan8055/maku-travel-verse/pull/58
5. Click "Close pull request" button (do NOT merge)

## Handling the Stale PRs with Conflicts

The remaining 6 PRs all have merge conflicts and are based on very old commits. Here's what to do with each:

### Recommended: Close the Massive Stale PRs

These PRs are too large and too outdated to safely merge:

```bash
# Close PR #52 (956 commits, 74K+ additions - emergent integration)
gh pr close 52 --repo Paavan8055/maku-travel-verse --comment "Closing due to being too stale and too large. Please recreate as smaller, focused PRs if functionality is still needed."

# Close PR #55 (898 commits, 68K+ additions - environment config)
gh pr close 55 --repo Paavan8055/maku-travel-verse --comment "Closing due to being too stale and too large. Please recreate as smaller, focused PRs if functionality is still needed."

# Close PR #49 (139 commits, 29K+ additions - Maku smart dreams)
gh pr close 49 --repo Paavan8055/maku-travel-verse --comment "Closing due to being stale. Please recreate with current main as base if functionality is still needed."
```

### Cherry-pick Security Fixes (PRs #48 and #36)

These PRs contain important security improvements but are too stale to merge directly:

```bash
# For PR #48 (security incident report - gitleaks setup)
# 1. Create a new branch
git checkout main
git pull origin main
git checkout -b security/gitleaks-setup

# 2. Cherry-pick the relevant security commits from PR #48
# (You'll need to identify the specific commit SHAs for gitleaks config)
git fetch origin security/incident-report
# Review commits and cherry-pick the relevant ones:
git log origin/security/incident-report --oneline | grep -i "gitleaks\|security"

# 3. Create a new PR with just the security changes
gh pr create --title "security: Add gitleaks configuration and pre-commit hooks" \
  --body "Cherry-picked security improvements from PR #48. Adds gitleaks scanning to prevent secret commits." \
  --base main

# 4. Close the old PR #48
gh pr close 48 --repo Paavan8055/maku-travel-verse --comment "Closing stale PR. Security fixes have been cherry-picked to a new PR."

# For PR #36 (edge function security - JWT auth)
# Follow similar process as above for the JWT and rate limiting changes
```

## Complete Cleanup Script

Here's a complete script to close all the stale PRs at once:

```bash
#!/bin/bash
# Save as close-stale-prs.sh and run with: bash close-stale-prs.sh

REPO="Paavan8055/maku-travel-verse"

echo "Merging PR #57 (CLI tool)..."
gh pr merge 57 --squash --delete-branch --repo $REPO

echo "Closing PR #58 (duplicate)..."
gh pr close 58 --repo $REPO --comment "Closing as duplicate of PR #57 which has been merged."

echo "Closing large stale PRs..."
gh pr close 52 --repo $REPO --comment "Closing due to being too stale and too large (956 commits, 74K+ additions). Please recreate as smaller, focused PRs if functionality is still needed."

gh pr close 55 --repo $REPO --comment "Closing due to being too stale and too large (898 commits, 68K+ additions). Please recreate as smaller, focused PRs if functionality is still needed."

gh pr close 49 --repo $REPO --comment "Closing due to being stale (139 commits, 29K+ additions). Please recreate with current main as base if functionality is still needed."

echo "Closing security PRs (will cherry-pick fixes separately)..."
gh pr close 48 --repo $REPO --comment "Closing stale PR. Important security fixes (gitleaks setup) will be cherry-picked to a new PR from current main."

gh pr close 36 --repo $REPO --comment "Closing stale PR. Important security fixes (JWT auth, rate limiting) will be cherry-picked to a new PR from current main."

echo "Done! All open PRs have been handled."
echo "Next steps:"
echo "1. Cherry-pick security fixes from PRs #48 and #36 to new PRs"
echo "2. Review OPEN_PRS_SUMMARY.md for detailed analysis"
```

## Verification

After running the commands, verify that all PRs are closed:

```bash
gh pr list --repo Paavan8055/maku-travel-verse --state open
```

You should only see PR #59 (this PR) remaining open.

## Summary

- **Mergeable**: PR #57 ✅
- **Close (duplicate)**: PR #58 ❌
- **Close (too stale)**: PRs #49, #52, #55 ❌
- **Close (will cherry-pick)**: PRs #36, #48 ❌

Total PRs to close: 7  
Total PRs to merge: 1

## Reference

For detailed analysis of each PR, see:
- `OPEN_PRS_SUMMARY.md` - Comprehensive PR analysis
- https://github.com/Paavan8055/maku-travel-verse/pulls - View all PRs online
