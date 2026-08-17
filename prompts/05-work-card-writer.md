# Prompt 05 — Work Card Writer

Goal: create one markdown file per work card under `work-cards/`.

Read:

- `project-brief.md`
- `architecture.md`
- `design.md`
- `build-blueprint.md`

Use this file naming pattern:

```text
work-cards/01-project-skeleton.md
work-cards/02-first-visible-version.md
work-cards/03-core-behaviour.md
work-cards/04-save-or-polish.md
work-cards/05-review-and-fix.md
work-cards/06-github-vercel-proof.md
```

For a browser-local tool, use this pattern instead:

```text
work-cards/01-project-skeleton.md
work-cards/02-static-layout.md
work-cards/03-add-item.md
work-cards/04-update-delete-item.md
work-cards/05-localstorage-save-refresh.md
work-cards/06-review-and-fix.md
work-cards/07-github-vercel-proof.md
```

Each work card must use this structure:

```md
# Work Card NN — Title

## Goal

## Inputs

## Files likely touched

## Instructions for the coding agent

## What not to do

## Done when

## Verification steps

## Localhost test before continuing

## Stop condition

## Status
Not started
```

Each Work Card must include a `Design check` line under Verification steps, referencing `design.md`.

Content-led site example:

```text
Design check: first section follows design.md mood, spacing, CTA style, and mobile rules.
```

Browser-local tool example:

```text
Design check: item card/list, input, update/delete controls, empty state, and mobile stacking follow design.md.
```

Every generated Work Card must also include a `## Localhost test before continuing` section, written for that specific card:

```md
## Localhost test before continuing

After this card, the learner should test:

- [Specific test for this card]
- [Specific test for this card]
- [Specific test for this card]

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.
```

Rules for the generated tests:

- If the card scaffolds the app, test that `npm run dev` starts and the app shell/header loads.
- If the card creates visible UI, test that the expected UI is visible.
- If the card adds add/create behavior, test adding a real sample item.
- If the card adds edit/delete behavior, test both edit and delete.
- If the card adds localStorage, test add item -> refresh browser -> item still appears.
- If the card adds styling/responsiveness, test at mobile width and confirm text, buttons, and cards are not cut off.
- If no browser preview exists yet, explicitly say: `No meaningful browser preview yet. Continue after the command/file checks pass.`
- For a content-led site, include checks for factual content, the primary action, working links, and mobile layout.
- For a browser-local tool, the complete card set must prove add, update, delete, save, and refresh persistence.

Do not write generic implementation-only cards. Every card includes learner QA.

After writing the cards, update `build-status.md`:

- Current phase: Ready to Build
- Current KDBM Lite stage: Build
- Current work card: `work-cards/01-project-skeleton.md`
- Completed planning files list
- Next instruction for AI:
  `Read build-status.md, build-blueprint.md, and work-cards/01-project-skeleton.md. Implement only Work Card 01. Stop after verification and update build-status.md.`

Stop. Do not implement.
