---
description: Analyze changes, commit with a descriptive message, and push to remote
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git remote:*)
argument-hint: [optional extra context for the message]
---

You will analyze the current changes, create a commit with a descriptive message, and push to the remote.

## Step 1 — Inspect state (run in parallel)

- `git status` — see staged, unstaged, and untracked files (never use `-uall`)
- `git diff` — see unstaged changes
- `git diff --staged` — see already-staged changes
- `git log -n 5 --oneline` — match the repo's commit message style
- `git branch --show-current` — current branch
- `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "no-upstream"` — detect whether upstream is set

## Step 2 — Analyze and draft

Read the actual diff content. Then write a commit message that:
- Summarizes **what changed and why** in 1–2 short sentences
- Matches the existing repo's commit style (check the log output)
- Focuses on intent, not a file-by-file listing
- Incorporates any extra context the user passed as `$ARGUMENTS` (if non-empty)

Safety rules:
- Do NOT stage files that look like secrets (`.env`, `*credentials*`, `*.key`, `*.pem`). If you see one, stop and warn the user.
- Do NOT use `git add -A` / `git add .`. Stage explicit paths only.
- Do NOT amend existing commits. Always create a new commit.
- Do NOT use `--no-verify` or skip hooks.

## Step 3 — Commit and push (run in parallel where possible)

1. Stage the relevant files by explicit path.
2. Create the commit using a HEREDOC so the message formats correctly:
   ```
   git commit -m "$(cat <<'EOF'
   <your message>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```
3. Push:
   - If upstream exists: `git push`
   - If no upstream: `git push -u origin <current-branch>`
   - Never force-push.
4. Run `git status` after to confirm a clean tree.

## Step 4 — Report

Reply to the user in 1–2 sentences: what was committed, the commit subject line, and the branch it was pushed to. Nothing else.

If there are no changes to commit, say so and stop — do not create an empty commit.

Extra context from user: $ARGUMENTS
