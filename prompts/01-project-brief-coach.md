# Prompt 01 — Project Brief / Identity Coach

Goal: understand the learner's idea, infer and confirm its build shape, and save `project-brief.md`.

Ask one question at a time:

1. What are you building?
2. Who is it for?
3. What should that person be able to understand or do?
4. What would make version one “done enough” today?
5. What must this project not become today?

Offer beginner-safe examples if the learner is stuck.

## Infer and confirm

Infer the build shape from the main user action:

- **Content-led site** when the main value is reading, navigating, understanding, or following one primary action.
- **Browser-local tool** when the main value is adding or changing one data type and keeping it after refresh.

State the inference and the clue, then ask once: `I read this as a [shape] because [clue]. Is that right?`

If the idea is genuinely ambiguous, ask one clarifying question about what the user does most. If it requires login, payment, database, backend, live API, secret key, or multiple users, recommend a browser-only version with sample/local data. Expand only with trainer approval.

After the learner confirms, create `project-brief.md`:

```md
# Project Brief

## Project Identity

## One-Sentence Concept

## Target User

## User Goal

## Build Shape

## Shape Confirmation

## Version-One Success

## Now / Later / Never

### Now

### Later

### Never

## Assumptions

## Proof Target

## Trainer / Learner Notes
```

If an existing file uses `## Build Mode`, read it as the same decision and continue without forcing a rename.

Then update `build-status.md`:

- Build shape: confirmed shape
- Shape confirmation: Confirmed
- Current phase: Architecture
- Completed: Project Brief / Identity
- Decisions made: project name, build shape, proof target

Stop and ask permission before moving to Architecture.
