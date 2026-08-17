# KDBM Lite Starter Pack

KDBM Lite means KrackedDevs Build Method Lite. Use this folder to move through one durable loop:

`Spec → Build → Check → Ship`

The AI helps with speed. You still decide the goal, confirm the plan, test the result, and own what ships.

## What this pack creates

These files are the only source of truth for progress:

- `project-brief.md` — project identity, user, scope, build shape, and success target.
- `architecture.md` — stack, structure, logic, and data/storage decisions.
- `design.md` — inspiration translated into safe layout, style, mobile, and anti-slop rules.
- `build-blueprint.md` — the complete builder-ready specification.
- `build-status.md` — current phase, completed work, blockers, decisions, and next instruction.
- `work-cards/*.md` — one small implementation step at a time.

The chat is not the source of truth. The files are.

The Design phase is required. Do not create the Build Blueprint or Work Cards until `design.md` is specific about what to borrow, what not to copy, layout, components, mobile behavior, and accessibility.

## Start in your coding workspace

Use VS Code, Antigravity, Cursor, or another AI coding workspace that can read and write project files and run terminal commands.

1. Rename this folder to your project name.
2. Open the entire folder in your coding workspace.
3. Open its AI agent or coding chat.
4. Paste this boot prompt:

```text
Read START_HERE.md and prompts/00-run-kdbm-lite-coach.md.

Run the KDBM Lite Coach exactly as instructed.

Planning phase only:
- create or update markdown planning files only
- do not create app code yet
- do not install packages yet
- do not edit project source files yet

Start with the Setup Gate.
Ask me one question at a time.
```

## How build shape works

You do not need to choose between a website course and an app course. Explain what you want to build. The coach will:

1. infer whether your idea is mainly a content-led site or a browser-local tool;
2. state what it inferred and why;
3. ask you to confirm or correct it once;
4. apply the matching scope and test guardrails.

If your idea is unclear, the coach asks one clarifying question. If it needs login, payments, a database, a backend, or a live API, the coach proposes a safe browser-only version unless your trainer approves the expansion.

## If your workspace cannot read files

Open `prompts/00-run-kdbm-lite-coach.md`, copy the current phase, and paste it into the agent. After every phase, make sure the agent saves the confirmed result to the named markdown file.

## Workspace notification note

Some coding workspaces or Windows notifications show a shortened project name. Follow the checkpoint inside the agent chat, not the notification text. Use a clear folder name such as `campus-event-guide`.

## After planning is complete

You may switch to the implementation model your trainer recommends. Paste:

```text
Read build-status.md, build-blueprint.md, design.md, and the current work card listed in build-status.md.
Implement only that work card.
Run its verification steps, update build-status.md, and stop for my check.
```
