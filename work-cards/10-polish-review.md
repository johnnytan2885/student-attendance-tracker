# Work Card 10 — Polish & Review

## Goal

Clean up any rough edges, add missing loading/error/empty states, verify mobile layout, check accessibility basics, and run the full proof ladder end-to-end.

## Inputs

- `design.md` — full design verification checklist
- `build-blueprint.md` — review mirror, proof ladder, guardrails
- All previous work cards must be complete

## Files likely touched

- Any frontend file that needs polish
- `frontend/src/App.css` (if responsive or style fixes needed)
- `frontend/src/components/Navbar.jsx`
- `frontend/src/pages/*.jsx` (error/loading state fixes)

## Instructions for the coding agent

1. **Audit every page/component for:**
   - Loading state (skeleton or spinner while data fetches)
   - Empty state (meaningful message + CTA when no data)
   - Error state (error message + retry option when API fails)
   - Edge cases (404 student, invalid date, etc.)

2. **Design check against `design.md`:**
   - Colors: verify all uses of primary, success, danger, warning match the palette
   - Cards: white, proper shadow and border-radius
   - Buttons: rounded (8px), consistent style
   - Typography: system font stack applied everywhere
   - No placeholder text or lorem ipsum remains
   - Navbar: app name + logout, clean and minimal

3. **Mobile check:**
   - Open DevTools at 320px width on every page
   - Fix any overflow, cut-off text, or misaligned elements
   - Verify all tap targets >= 44px
   - Verify no horizontal scroll

4. **Accessibility check:**
   - All form inputs have associated `<label>` elements
   - Tab order follows visual order
   - Focus styles are visible on all interactive elements
   - Status is communicated with text, not just color
   - Buttons have visible text or aria-label

5. **Run the full proof ladder manually:**

   | Step | Action | Expected |
   |---|---|---|
   | 1 | Visit app without login | Redirect to /login |
   | 2 | Login with default admin | Redirect to /change-password |
   | 3 | Change password | Redirect to /dashboard |
   | 4 | Login with new password | Go to /dashboard |
   | 5 | Add student "Alice" | Appears in grid |
   | 6 | Add student "Bob" | Both appear |
   | 7 | Open Attendance page | Both students shown |
   | 8 | Mark Alice present, Bob absent | Success |
   | 9 | Open Bob's profile | Credits = 1, record shows absent |
   | 10 | Set replacement class for Bob | Credits = 0, replacement date shown |
   | 11 | Archive Alice | Disappears from grid |
   | 12 | Toggle show archived | Alice visible with inactive indicator |
   | 13 | Delete Alice | Confirmation → removed from DB |
   | 14 | Logout | Back to login |
   | 15 | Login with old password | 401 / error |
   | 16 | Login with new password | Works |

## What not to do

- Do not add new features
- Do not add animations or transitions unless they were in design.md
- Do not install new packages

## Done when

- Every page has loading, empty, and error states handled
- Mobile layout works at 320px on every page
- Full proof ladder passes end-to-end
- No "lorem ipsum", placeholder text, or hardcoded demo data in production
- No console errors in normal flow
- No horizontal scroll at any reasonable width

## Verification steps

1. Navigate to every page and confirm loading states appear (may need to throttle network)
2. Test empty state: delete all students, confirm empty state shows on dashboard
3. Test error state: stop backend, refresh frontend, confirm error message appears
4. Open each page at 320px width in DevTools — no overflow or cut-off
5. Tab through every page — focus is visible, order makes sense
6. Resize from 320px to 1200px — layout adjusts smoothly
7. Run the full proof ladder end-to-end
8. **Design check:** Full design verification checklist from design.md should pass:
   - [ ] Login page is centered, simple
   - [ ] Change password page explains requirement
   - [ ] Student list shows active by default with archive toggle
   - [ ] Each student card shows name + credit count
   - [ ] Add student form is a modal
   - [ ] Attendance page has date picker + present/absent per student
   - [ ] Absent = red tint + text, Present = green tint + text
   - [ ] Student profile shows full attendance history
   - [ ] Replacement form available on profile
   - [ ] Empty state when no students
   - [ ] Delete has confirmation dialog
   - [ ] Archive hides student (toggle to see archived)
   - [ ] Works at 320px width
   - [ ] Buttons are 44px min tap target
   - [ ] Focus outlines visible when tabbing
   - [ ] Status communicated by text, not just color

## Localhost test before continuing

After this card, the learner should test:

- [ ] Every page has loading, empty, and error states
- [ ] Mobile layout at 320px works on every page
- [ ] Tab through the app — focus is visible
- [ ] Stop the backend — frontend shows error state instead of broken UI
- [ ] Full proof ladder passes (the 16-step table above)
- [ ] No console errors during normal flow
- [ ] No horizontal scroll at any width

If all tests pass, reply `continue`.
If anything fails, reply `fix` and describe what you see.

## Stop condition

If the app has critical bugs that prevent the proof ladder from completing, fix those first. If design diverges significantly from design.md, re-read the design file and adjust CSS.

## Status

Completed