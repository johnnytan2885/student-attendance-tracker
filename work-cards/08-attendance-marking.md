# Work Card 08 — Attendance Marking Page

## Goal

Build the page to mark attendance for a selected date. Display all active students with present/absent toggles, submit, and show the result. Wire to the attendance API.

## Inputs

- `architecture.md` — attendance flow, API endpoints
- `design.md` — form placement, color rules for status, mobile rules
- `build-blueprint.md` — proof ladder step 2
- `work-cards/03-attendance-api.md` — attendance API must be complete
- `work-cards/06-login-auth-pages.md` — auth must be complete
- `work-cards/07-dashboard-student-crud.md` — dashboard must be complete

## Files likely touched

- `frontend/src/pages/AttendanceForm.jsx`
- `frontend/src/api/client.js` (add attendance API functions)
- `frontend/src/App.jsx` (if route changes needed)
- `frontend/src/App.css` (add attendance form styles)

## Instructions for the coding agent

1. Add to `frontend/src/api/client.js`:
   - `markAttendance(date, records)`
   - `getStudentAttendance(studentId)`
   - `setReplacement(studentId, attendanceId, replacementDate)`

2. Create `frontend/src/pages/AttendanceForm.jsx`:
   - Title: "Mark Attendance"
   - Date input (type="date", default to today)
   - Fetches all active students on mount
   - For each student, show:
     - Student name
     - Toggle: Present (green) / Absent (red) — default to Present
     - Color is never the only indicator — add text label "Present" or "Absent"
   - Large enough toggle to tap on mobile (44px)
   - Submit button: "Save Attendance"
   - On submit:
     - POST to `/api/attendance` with the date and records
     - Show success message with count of students marked
     - Option to mark another date
   - Loading state while submitting
   - Error display if API fails

3. Styling:
   - Date input styled per design.md input rules
   - Each student row: name on left, Present/Absent toggle on right
   - Absent: soft red background tint
   - Present: soft green background tint
   - On mobile: stack vertically, each student gets a full row
   - Submit button: full width on mobile, centered on desktop

## What not to do

- Do not add the student profile page yet (Card 09)
- Do not add replacement scheduling here (that's on the profile)
- Do not auto-mark — learner must explicitly choose present/absent for each student

## Done when

- Date picker shows with default today
- All active students are listed with Present/Absent toggle
- Default is Present for all
- Submitting marks attendance and returns success message
- Absent students get +1 credit (when you check their profile or via API)
- Mobile layout stacks rows vertically

## Verification steps

1. Navigate to the Attendance page (from Navbar or direct route)
2. See all active students listed with Present default
3. Change a student to Absent
4. Set the date (or keep default today)
5. Submit — see success message
6. Go to Dashboard, click that student — their profile should show attendance record and updated credit
7. Mark attendance again for the same date — should confirm if duplicate is allowed (backend should handle or return success if re-marking the same date)
8. **Design check:** Each student row has text label "Present" or "Absent". Colors (red/green) are backed by text. Submission button is full-width on mobile. Rows are tappable at 44px min.

## Localhost test before continuing

After this card, the learner should test:

- [ ] Attendance page loads with all active students
- [ ] Each student has a toggle between Present and Absent
- [ ] Default state is Present for all students
- [ ] Date input is set to today by default
- [ ] Submitting with one student absent shows success
- [ ] That student's credits increased by 1 (check via dashboard or API)
- [ ] Page looks good at 320px width — no horizontal scroll, rows are tappable

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If the date picker doesn't render or the API call fails, check browser console for errors and verify backend server is running.

## Status

Completed