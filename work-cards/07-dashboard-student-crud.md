# Work Card 07 — Dashboard & Student CRUD

## Goal

Build the Dashboard page showing the active student list with add, edit, archive, and delete functionality in modals. Wire everything to the student API.

## Inputs

- `architecture.md` — component map, API endpoints
- `design.md` — card style, button style, modal style, empty state, mobile rules, color rules
- `build-blueprint.md` — proof ladder step 1
- `work-cards/02-student-api.md` — student API must be complete
- `work-cards/06-login-auth-pages.md` — auth must be complete

## Files likely touched

- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/components/StudentCard.jsx`
- `frontend/src/components/Modal.jsx`
- `frontend/src/components/EmptyState.jsx`
- `frontend/src/api/client.js` (add student API functions)
- `frontend/src/App.jsx` (if route changes needed)
- `frontend/src/App.css` (add card, modal, button styles)

## Instructions for the coding agent

1. Create `frontend/src/api/client.js` — add student API functions:
   - `getStudents(showAll)`, `getStudent(id)`, `createStudent(data)`, `updateStudent(id, data)`, `deleteStudent(id)`, `archiveStudent(id)`

2. Create `frontend/src/pages/Dashboard.jsx`:
   - Fetches student list on mount (active students by default)
   - Shows "Add Student" button at top
   - Toggle to show/hide archived students
   - Renders `StudentCard` for each student in a responsive grid
   - Shows `EmptyState` component when no students match
   - Loading state while fetching
   - Error state if API fails

3. Create `frontend/src/components/StudentCard.jsx`:
   - Shows student name, credit badge (muted gold #D4A843), active/inactive indicator
   - Click on card → navigate to `/students/:id`
   - Edit button → opens edit modal
   - Archive/Unarchive button
   - Delete button → confirmation modal → delete

4. Create `frontend/src/components/Modal.jsx`:
   - Reusable modal with backdrop, close button, title, content slot
   - Default close on Escape key and backdrop click
   - Focus trap (basic)

5. Create `frontend/src/components/EmptyState.jsx`:
   - Centered message: "No students yet" with "Add your first student" CTA button
   - No illustration (text + button only, per design.md)

6. In the Dashboard, implement inline modal for Add/Edit student:
   - Fields: name (required), email (optional), notes (optional)
   - Save creates or updates student
   - On success: refresh student list

7. Add delete confirmation — a modal asking "Are you sure?" with Cancel and Delete buttons (red).

8. Add all new styles to `App.css` following design.md rules:
   - Card style: white, 12px border-radius, subtle shadow, 16px padding
   - Button styles: rounded 8px, sky blue primary, outlined secondary, red danger
   - Modal: centered overlay with backdrop blur, white card

## What not to do

- Do not add attendance features yet (Card 08)
- Do not add student profile page yet (Card 09)
- Do not use any CSS framework — plain CSS only

## Done when

- Dashboard loads and displays active students
- Clicking "Add Student" opens a modal with the form
- Filling in name and saving adds a student to the list
- Edit button opens modal with pre-filled data, saving updates the card
- Archive button hides the student from the main list
- Toggle to show archived reveals archived students
- Delete button shows confirmation, then removes the student
- Empty state shows when no students exist
- Mobile layout stacks cards in 1 column

## Verification steps

1. Login to the app
2. Dashboard shows empty state with "Add your first student" button
3. Add a student — appears in the list with name and 0 credits
4. Add another student — both appear
5. Edit a student — changes reflect immediately
6. Archive a student — disappears from main list
7. Toggle "Show archived" — archived student appears with inactive indicator
8. Unarchive a student — back in main list
9. Delete a student — confirmation dialog shows, student removed after confirm
10. Refresh the page — data persists (from backend)
11. **Design check:** Cards are white with shadow, rounded corners, proper spacing. Buttons use sky blue primary. Empty state has no illustration. Mobile: single column at 320px, tap targets >= 44px. Status is communicated with text, not just color.

## Localhost test before continuing

After this card, the learner should test:

- [ ] Dashboard loads with student list (or empty state)
- [ ] Add Student modal opens, creating a student works
- [ ] Student appears in the grid with name and credit badge
- [ ] Edit modal opens with pre-filled data, save updates card
- [ ] Archive hides student, toggle shows archived
- [ ] Delete shows confirmation, student removed after confirm
- [ ] Refresh page — data persists
- [ ] Single column layout at 320px width
- [ ] Empty state shows "No students yet" with CTA

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If API calls fail, check that the backend server is running and the proxy in vite.config.js is correct.

## Status

Completed