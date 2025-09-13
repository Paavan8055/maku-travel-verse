# Affected commits referencing `maku-supabase-action/server/.env`

This document lists the commits (from `backup-before-secrets-clean`) that referenced the now-purged file `maku-supabase-action/server/.env`. Use this for audit and rotation tracking.

> NOTE: These commits are from the backup branch and show who added the file and follow-up reverts. Rotation of any exposed credentials is urgent.

## Commits

- 15d0e0af85b10d5e58b3cbb7d93b568496ebd071 — Paavan8055 <80146877+Paavan8055@users.noreply.github.com>
  - Date: Tue Aug 26 01:20:25 2025 -0700
  - Message: Create .env
  - Path: maku-supabase-action/server/.env

- 36b33a3673ec5bc46de1ec0c246542fcdcdbe74c — gpt-engineer-app[bot] <159125892+gpt-engineer-app[bot]@users.noreply.github.com>
  - Date: Thu Aug 28 15:39:31 2025 +0000
  - Message: Reverted to commit 988a65766e9341e14f6321669db3e7047d3094f8
  - Path: maku-supabase-action/server/.env

- 25bbe14ce6f199033507ee290dc85f22d9583fae — gpt-engineer-app[bot] <159125892+gpt-engineer-app[bot]@users.noreply.github.com>
  - Date: Thu Aug 28 15:47:56 2025 +0000
  - Message: Reverted to commit 1aa571d5ff460a5902b5dfdc753c0c1352c9c90a
  - Path: maku-supabase-action/server/.env

---

Files for auditors:

- `security/affected-commits.txt` — raw commit lines (backup branch)
- `gitleaks-candidates.txt` — pruned gitleaks candidate list
- `gitleaks-report-pruned.json` — full pruned gitleaks report

If you want me to include commit SHAs with the file contents (the snapshots), I can extract the blob objects and save the file contents per commit. Reply with "include-blobs" to request that.
