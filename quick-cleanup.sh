#!/bin/bash
# Quick PR Cleanup Script
# Run this script to merge and close all open PRs
# Usage: bash quick-cleanup.sh

set -e  # Exit on error

REPO="Paavan8055/maku-travel-verse"

echo "=========================================="
echo "PR Cleanup Script for maku-travel-verse"
echo "=========================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Merge PR #57
echo "📝 Step 1/8: Merging PR #57 (CLI helper tool)..."
if gh pr merge 57 --squash --delete-branch --repo $REPO; then
    echo "✅ PR #57 merged successfully"
else
    echo "⚠️  PR #57 merge failed - may already be merged or closed"
fi
echo ""

# Close PR #58
echo "📝 Step 2/8: Closing PR #58 (duplicate of #57)..."
if gh pr close 58 --repo $REPO --comment "Closing as duplicate of PR #57 which has been merged."; then
    echo "✅ PR #58 closed successfully"
else
    echo "⚠️  PR #58 close failed - may already be closed"
fi
echo ""

# Close PR #52
echo "📝 Step 3/8: Closing PR #52 (emergent integration - too stale)..."
if gh pr close 52 --repo $REPO --comment "Closing due to being too stale and too large (956 commits, 74K+ additions). Please recreate as smaller, focused PRs if functionality is still needed."; then
    echo "✅ PR #52 closed successfully"
else
    echo "⚠️  PR #52 close failed - may already be closed"
fi
echo ""

# Close PR #55
echo "📝 Step 4/8: Closing PR #55 (environment config - too stale)..."
if gh pr close 55 --repo $REPO --comment "Closing due to being too stale and too large (898 commits, 68K+ additions). Please recreate as smaller, focused PRs if functionality is still needed."; then
    echo "✅ PR #55 closed successfully"
else
    echo "⚠️  PR #55 close failed - may already be closed"
fi
echo ""

# Close PR #49
echo "📝 Step 5/8: Closing PR #49 (Maku smart dreams - stale)..."
if gh pr close 49 --repo $REPO --comment "Closing due to being stale (139 commits, 29K+ additions). Please recreate with current main as base if functionality is still needed."; then
    echo "✅ PR #49 closed successfully"
else
    echo "⚠️  PR #49 close failed - may already be closed"
fi
echo ""

# Close PR #48
echo "📝 Step 6/8: Closing PR #48 (security incident - will cherry-pick)..."
if gh pr close 48 --repo $REPO --comment "Closing stale PR. Important security fixes (gitleaks setup) will be cherry-picked to a new PR from current main."; then
    echo "✅ PR #48 closed successfully"
else
    echo "⚠️  PR #48 close failed - may already be closed"
fi
echo ""

# Close PR #36
echo "📝 Step 7/8: Closing PR #36 (edge function security - will cherry-pick)..."
if gh pr close 36 --repo $REPO --comment "Closing stale PR. Important security fixes (JWT auth, rate limiting) will be cherry-picked to a new PR from current main."; then
    echo "✅ PR #36 closed successfully"
else
    echo "⚠️  PR #36 close failed - may already be closed"
fi
echo ""

# List remaining open PRs
echo "📝 Step 8/8: Listing remaining open PRs..."
echo ""
gh pr list --repo $REPO --state open
echo ""

echo "=========================================="
echo "✅ PR Cleanup Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Merged: PR #57"
echo "  - Closed: PRs #58, #52, #55, #49, #48, #36"
echo ""
echo "Next steps:"
echo "  1. Review OPEN_PRS_SUMMARY.md for detailed analysis"
echo "  2. Cherry-pick security fixes from PRs #48 and #36 if needed"
echo "  3. Close PR #59 (this PR) once you've verified everything"
echo ""
