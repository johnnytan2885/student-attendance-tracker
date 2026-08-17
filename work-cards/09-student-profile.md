# Work Card 09 — Student Profile Page

## Goal

Build the student profile page showing full details, attendance history, credit balance, and the replacement class form. Wire to the attendance and student APIs.

## Inputs

- `architecture.md` — profile flow, replacement flow, API endpoints
- `design.md` — card style, button style, mobile rules
- `build-blueprint.md` — proof ladder steps 2, 3
- `work-cards/07-dashboard-student-crud.md` — student CRUD pages must be complete
- `work-cards/08-attendance-marking.md` — attendance flow must be complete

## Files likely touched

- `frontend/src/pages/StudentProfile.jsx`
- `frontend/src/api/client.js` (ensure all needed functions exist)
- `frontend/src/App.css` (add profile page styles)

## Instructions for the coding agent

1. Create `frontend/src/pages/StudentProfile.jsx`:
   - Fetches student data by id from URL params
   - Fetches attendance history: `GET /api/students/:id/attendance`
   - Displays:
     - Student name, email, notes at top
     - Credit badge (muted gold, prominent)
     - "Edit Student" button → inline edit or opens modal
     - "Archive" / "Unarchive" button
     - "Delete Student" button with confirmation
   - Attendance history section:
     - Table/list: Date, Status, Replacement Date (if set)
     - Ordered by date descending
     - Present rows: normal style
     - Absent rows: soft red tint
     - Replacement date shown if present
   - Replacement class section:
     - Button "Set Replacement Class" — opens a form
     - Shows list of attendance records with status "absent" that don't have a replacement_date yet
     - User selects an absent record, enters a replacement date
     - Submit consumes 1 credit
     - Success message after setting

2. Styling:
   - Profile at top in a card
   - Credit badge as a pill
   - Attendance history as a clean table/list
   - Replacement form in a modal
   - Mobile: table converts to stacked rows (label + value per line)

## What not to do

- Do not modify the attendance marking page
- Do not add bulk operations
- Do not allow setting replacement for present records or already-replaced records

## Done when

- Visiting `/students/:id` shows the student's full info
- Credit count is displayed prominently
- Attendance history loads and shows date + status + replacement date
- Absent rows are visually distinct (red tint + text)
- "Set Replacement Class" shows only absent records without replacement
- Setting a replacement decrements credits and updates the history
- Error shown if trying to set replacement with 0 credits
- Edit/Archive/Delete work from the profile page

## Verification steps

1. Navigate to a student profile from the Dashboard
2. Confirm name, credits, attendance history are visible
3. If no attendance records yet, show empty attendance state
4. Go mark attendance in another tab, come back — profile updates
5. Click "Set Replacement Class" — modal shows absent records without replacement
6. Select a record, enter a date, submit — credit decrements, history shows replacement date
7. Try setting replacement when credits = 0 — error shown
8. Edit student from profile — changes persist
9. Delete student from profile — redirects to dashboard after confirmation
10. **Design check:** Credit badge uses muted gold (#D4A843). Absent rows use red tint with "Absent" text. Mobile stacks attendance rows. Buttons are 44px min tap target.

## Localhost test before continuing

After this card, the learner should test:

- [ ] Student profile loads with name, credits, attendance history
- [ ] Attendance history shows date, status (Present/Absent), replacement date
- [ ] Absent records are visually distinct
- [ ] "Set Replacement Class" button shows modal with eligible absent records
- [ ] Setting a replacement date decrements credits by 1
- [ ] Setting replacement with 0 credits shows error
- [ ] Profile page looks good at 320px width

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If student profile doesn't load, check the route param and API endpoint paths.

## Status

Completed