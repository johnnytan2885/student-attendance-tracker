# Work Card 03 — Attendance API

## Goal

Create the attendance marking and replacement class endpoints. Auto-credit students on absence. Verify the credit logic with API tests.

## Inputs

- `architecture.md` — attendance data model, replacement flow, API endpoints
- `build-blueprint.md` — proof ladder steps 2, 3
- `work-cards/02-student-api.md` — must be completed first

## Files likely touched

- `backend/src/routes/attendance.js`
- `backend/src/index.js`

## Instructions for the coding agent

1. Create `backend/src/routes/attendance.js` with an Express Router.
2. Implement these endpoints:
   - `POST /api/attendance` — body: `{ date: "YYYY-MM-DD", records: [{ student_id, status }] }`. For each record:
     - Create an `attendance_record` row with the given date, student_id, and status
     - If status is "absent", increment the student's `credits` by 1
     - Return 201 with created records count
   - `GET /api/students/:id/attendance` — return all attendance records for a student, ordered by date desc
   - `POST /api/attendance/replacement` — body: `{ student_id, attendance_id, replacement_date: "YYYY-MM-DD" }`:
     - Find the attendance record by id (must belong to the given student)
     - Set `replacement_date` on that record
     - Decrement the student's `credits` by 1 (must be >= 1 before decrement, otherwise return 400)
     - Return 200 with updated attendance record
3. Add validation: date format check, student_id must exist, status must be "present" or "absent".
4. Add error handling: return 400 for invalid input, 404 for missing student/attendance record, 400 for insufficient credits.
5. Mount the attendance routes in `backend/src/index.js`.

## What not to do

- No auth middleware yet (Card 04)
- No frontend yet
- Do not allow negative credits — validate before decrementing
- Do not modify attendance records after creation (no update endpoint)

## Done when

- Marking a student absent increments their credits by 1
- Setting a replacement date decrements credits by 1
- Setting replacement with 0 credits returns 400
- Getting attendance history returns records in date-desc order
- Validation catches missing/invalid fields

## Verification steps

1. Create a student first (or use existing):
   ```bash
   curl -X POST http://localhost:3001/api/students -H "Content-Type: application/json" -d '{"name":"Test Student"}'
   ```
2. Mark attendance with mix of present/absent:
   ```bash
   curl -X POST http://localhost:3001/api/attendance -H "Content-Type: application/json" -d '{"date":"2026-08-17","records":[{"student_id":1,"status":"absent"},{"student_id":2,"status":"present"}]}'
   ```
3. Check student credits increased:
   ```bash
   curl http://localhost:3001/api/students/1
   # credits should be 1
   ```
4. Get attendance history:
   ```bash
   curl http://localhost:3001/api/students/1/attendance
   ```
5. Set replacement:
   ```bash
   curl -X POST http://localhost:3001/api/attendance/replacement -H "Content-Type: application/json" -d '{"student_id":1,"attendance_id":1,"replacement_date":"2026-08-24"}'
   ```
6. Check credits decreased back to 0:
   ```bash
   curl http://localhost:3001/api/students/1
   ```
7. Try setting replacement with 0 credits — expect 400.
8. **Design check:** No design impact for this card (API only).

## Localhost test before continuing

After this card, the learner should test:

- [ ] Marking a student absent increases credits by 1
- [ ] Attendance history returns records with correct date and status
- [ ] Setting a replacement date decreases credits by 1
- [ ] Setting replacement with 0 credits returns 400 error
- [ ] Invalid date or status returns 400

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If credit increment/decrement logic is incorrect, trace the SQL queries and fix the balance math.

## Status

Completed