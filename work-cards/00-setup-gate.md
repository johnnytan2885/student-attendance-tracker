# Work Card 00 — Setup Gate

## Goal

Confirm the learner has a capable coding workspace, required local tools, and publishing accounts before planning and building.

## Coding workspace checklist

Use VS Code, Antigravity, Cursor, or an equivalent workspace.

- [ ] The workspace opens this entire project folder.
- [ ] Its AI agent can read `START_HERE.md`.
- [ ] Its AI agent can create or update a markdown file in this folder.
- [ ] A terminal opens inside this project folder.
- [ ] A browser is available for localhost tests.

## Local tools checklist

- [ ] Node.js LTS installed.
- [ ] npm working.
- [ ] Git installed.

## Accounts checklist

- [ ] KrackedDevs account signed up / logged in.
- [ ] GitHub signed up / logged in.
- [ ] Vercel signed up / logged in with GitHub.
- [ ] Optional fallback AI account ready if the coding workspace becomes unavailable.

KrackedDevs account means the learner's account at krackeddevs.com.

## Command checks

Run in the project terminal:

```bash
node -v
npm -v
git --version
```

Each command must print a version number. If any command is missing, stop and fix it before building.

## Git identity check

Run:

```bash
git config --global user.name
git config --global user.email
```

If either is empty, set it with the learner's own details:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

## Windows install rescue

If Node or Git is missing on Windows, run these in PowerShell, then restart the coding workspace:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

## What not to do

- Do not start app code.
- Do not scaffold a project or install packages.
- Do not initialize Git.
- Do not deploy.
- Do not skip missing file access, terminal access, Node, npm, or Git.

## Done when

- The workspace can read/write markdown files and run terminal commands in this folder.
- `node -v`, `npm -v`, and `git --version` work.
- Git identity is present.
- KrackedDevs, GitHub, and Vercel accounts are ready, or the trainer accepts fallback proof.
- Results are recorded in `build-status.md`.

## Stop condition

If the workspace, Node, npm, or Git cannot be fixed in five minutes, ask the trainer for Pair Mode or Rescue Mode.

## Status

Completed
