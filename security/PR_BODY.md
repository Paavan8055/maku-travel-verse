# Summary

A sensitive file `maku-supabase-action/server/.env` containing a Supabase service-role-like key was found and removed from repository history.

## Actions taken

- Purged `maku-supabase-action/server/.env` from history and force-pushed the feature branch.
- Added `.gitleaks.toml` and integrated gitleaks into CI to run early in the lint job.
- Added `scripts/report-verify-jwt.js` and a pre-commit secret-scan.
- Created `SECURITY_INCIDENT.md` and `SECURITY_ROTATION_TEMPLATES.md` with rotation instructions.

## Files removed from history

- `maku-supabase-action/server/.env`

## Required immediate actions (P0)

- Rotate any compromised keys (Supabase service-role, Stripe secrets, provider API keys).
- Notify all owners and rotate keys used in production first.

Additional details and candidate files for review are in `gitleaks-candidates.txt` and `gitleaks-report-pruned.json`.

Please see `SECURITY_INCIDENT.md` for an incident timeline and `SECURITY_ROTATION_TEMPLATES.md` for rotation text templates.
