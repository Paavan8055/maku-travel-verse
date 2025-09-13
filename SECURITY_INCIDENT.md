# Security Incident Report — Committed Secrets

Date: 2025-09-13
Branch: codex/enable-jwt-verification-and-enhance-security

Summary

During routine security hardening we discovered committed secrets in the repository. Immediate action was taken to remove the highest-confidence secret file and harden CI:

- `maku-supabase-action/server/.env` was purged from git history using git-filter-repo and the branch was force-pushed.
- The working-tree `.env` file contained a publishable JWT-like key and was removed from the repository index and added to `.gitignore`.
- A tuned `.gitleaks.toml` was added and gitleaks was integrated into the `lint` job in CI to fail early on future secret commits.

Files flagged by gitleaks (ranked)

Top candidates from local gitleaks scan (pruned):

1. `scripts/validate-deployment.sh` (18 findings)
2. `.env.example` (15 findings) — placeholders; usually safe but flagged
3. `.env` (12 findings) — removed from index; consider rotation
4. `src/integrations/supabase/types.ts` (10 findings)
5. `src/integrations/supabase/client.ts` (6 findings)
6. `src/components/dashboard/TravelDocuments.tsx` (3 findings)
7. `src/components/SystemHealthIndicator.tsx` (3 findings)

Notes:
- Many earlier hits were produced in lockfiles and migration files; the report was pruned to ignore `package-lock.json` and `supabase/migrations/*` to reduce noise.
- The gitleaks report contains commit SHAs and line numbers for every finding; please review the report for exact details.

Recommended remediation steps (immediate)

1. Rotate exposed credentials immediately:
   - Supabase service-role key(s)
   - Any Stripe keys found or suspected
   - Any other provider keys referenced in flagged files

2. Notify the team and require re-clone or rebase of repos that track the rewritten branch.

3. Review and purge additional files from history (if they contain real secrets):
   - Candidates: `scripts/validate-deployment.sh`, `.env` (already removed from HEAD), `src/integrations/supabase/client.ts` (if it contains literal keys), etc.
   - I will not run additional destructive purges without your explicit confirmation.

4. Continue hardening:
   - Keep `.env` out of repo and use environment secrets (GitHub Secrets, deployment env vars).
   - Keep `gitleaks` rules tuned and consider adding a `.gitleaksignore` for allowed items.

Next actions I recommend I perform (pick one or multiple):
- Create an incident PR documenting the above (I will do that now unless you prefer to edit first).
- Show the detailed gitleaks JSON report and top findings inline for manual review.
- Prepare a curated list of exact file paths to purge from history and run git-filter-repo after you confirm.

Contact & audit trail

I created a local `gitleaks-report-pruned.json` and `gitleaks-candidates.txt` in the repo root with the findings. Please review them.
