# Resolving Git Merge Conflicts for Maku Travel OTA

This guide documents the exact workflow we use to keep long-running feature branches (such as `emergent-integration`) in sync with `main` while avoiding broken history.

## 1. Update local references
```bash
git fetch origin
```
Fetching before every rebase guarantees that you are working with the latest commits from both branches.

## 2. Rebase the feature branch onto the base branch
```bash
git checkout emergent-integration
git rebase origin/main
```
Rebasing keeps the commit history linear and ensures conflict resolution happens once. If your branch tracks a different base (for example `develop`), substitute that branch name instead of `main`.

> **Tip:** If you prefer to keep a copy of the pre-rebase branch, create a backup before rebasing:
> ```bash
> git branch emergent-integration-backup
> ```

## 3. Resolve conflicts file-by-file
Git pauses the rebase at each conflicted commit. For every file listed in `git status`:

1. Open the file in your editor.
2. Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Keep the correct implementation or blend both sides.
4. Save the file and run project checks (lint/tests) if the file affects runtime behaviour.

When you finish a file, stage it:
```bash
git add path/to/file
```

Once all conflicts in the current commit are staged, continue the rebase:
```bash
git rebase --continue
```
Repeat until Git reports "Successfully rebased".

If you need to abort at any time and return to the pre-rebase state:
```bash
git rebase --abort
```

## 4. Verify the repository state
After the rebase completes:

```bash
git status
npm run lint
npm test
```
This confirms there are no remaining staged changes and the codebase passes automated checks.

## 5. Force-push with lease protection
A rebase rewrites commits, so the remote branch must be updated with `--force-with-lease`:
```bash
git push origin emergent-integration --force-with-lease
```
The `--force-with-lease` flag ensures you only overwrite the remote if no one else has pushed new commits in the meantime.

## 6. Monitor the pull request
Finally, open the GitHub pull request and confirm:

- The branch reports "This branch has no conflicts".
- Required status checks (Netlify, Supabase, etc.) are green.
- The PR conversation shows the new commits and no pending review threads. You can also run `npm run pr:list -- --repo <owner/name>` to double-check all open PRs from the terminal (set `GITHUB_TOKEN` if the repository is private).

If any checks fail, address them locally and push additional fixes to the same branch.

---

Keeping this checklist handy should make conflict resolution repeatable and prevent the "Aw, Snap" crashes caused by large PR threads—you can focus on the conflicted files locally and only return to GitHub when the branch is clean.
