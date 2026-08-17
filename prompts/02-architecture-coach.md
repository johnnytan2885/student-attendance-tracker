# Prompt 02 — Architecture Coach

Goal: turn the confirmed brief into a practical structure and save `architecture.md`.

Read `project-brief.md` first. Use its confirmed Build Shape. If the shape is not confirmed, return to Prompt 01 before continuing.

Ask only what is needed for that shape.

## Content-led site architecture

Confirm:

- section order and factual content needed;
- one primary action;
- repeated cards or content blocks;
- navigation, links, and any non-submitting form behavior;
- responsive behavior and mobile first screen;
- whether a sample-data dashboard is clearly labelled as sample.

## Browser-local tool architecture

Confirm:

- the one data type or list;
- no more than 3–5 fields per item;
- add behavior;
- update, mark, or edit behavior;
- delete behavior;
- `localStorage` key name;
- empty state;
- refresh-persistence test.

## Scope rescue

If the requested structure needs auth/login, payments, database, backend, live API, secret key, multiple data tables, uploads, admin access, or multi-user sync, propose a browser-only substitute. Do not expand unless the trainer explicitly approves it.

After confirmation, create `architecture.md`:

```md
# Architecture

## Build Shape

## Stack Decision

## Structure Overview

## Component Map

## Data / State Model

## Storage Logic

## User Flow

## File Expectations

## Constraints

## Technical Non-Goals

## Verification Notes
```

Default stack unless the trainer says otherwise:

- Vite;
- React;
- plain CSS, or Tailwind only when the session is using it;
- `localStorage` only when browser-local persistence is part of the confirmed shape;
- no backend, auth, database, payment, or live API without explicit trainer approval.

Then update `build-status.md`:

- Current phase: Design
- Completed: Architecture
- Decisions made: stack, structure, data/storage decision

Stop and ask permission before moving to Design.
