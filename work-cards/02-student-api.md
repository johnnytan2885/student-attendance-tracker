# Work Card 02 — Student API

## Goal

Create the full CRUD + archive REST API for students. Verify each endpoint works with curl or a REST client.

## Inputs

- `architecture.md` — API endpoints, data model for student
- `build-blueprint.md` — proof ladder steps 1, 7, 8
- `work-cards/01-backend-foundation.md` — must be completed first

## Files likely touched

- `backend/src/routes/students.js`
- `backend/src/index.js`

## Instructions for the coding agent

1. Create `backend/src/routes/students.js` with an Express Router.
2. Implement these endpoints:
   - `GET /api/students` — return all active students (active=1), ordered by name
   - `GET /api/students?showAll=true` — return all students including archived
   - `GET /api/students/:id` — return single student by id (404 if not found)
   - `POST /api/students` — create student with `name` (required), `email` (optional), `notes` (optional); return 201 with created student
   - `PUT /api/students/:id` — update student fields; return updated student
   - `DELETE /api/students/:id` — permanently delete student; return 204
   - `PATCH /api/students/:id/archive` — toggle `active` flag; return updated student
3. Add input validation: name must be non-empty string, email optional but valid format if provided.
4. Mount the router in `backend/src/index.js` at `/api/students`.
5. Restart the server and test.

## What not to do

- No auth middleware yet (Card 04)
- No attendance logic yet (Card 03)
- No frontend yet
- Do not add soft-delete — use the `active` flag for archive; use DELETE for permanent removal

## Done when

- All 7 endpoints work
- Creating a student with valid data returns 201
- Creating a student with missing name returns 400
- Getting a non-existent student returns 404
- Archiving a student flips active to 0
- GET /api/students excludes archived by default
- Deleting a student removes them from the DB

## Verification steps

1. Send requests with curl or equivalent:
   ```bash
   # Empty list
   curl http://localhost:3001/api/students

   # Create student
   curl -X POST http://localhost:3001/api/students -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@test.com"}'

   # Get all
   curl http://localhost:3001/api/students

   # Get by id
   curl http://localhost:3001/api/students/1

   # Update
   curl -X PUT http://localhost:3001/api/students/1 -H "Content-Type: application/json" -d '{"notes":"Good student"}'

   # Archive
   curl -X PATCH http://localhost:3001/api/students/1/archive

   # Get all (should be empty since archived)
   curl http://localhost:3001/api/students

   # Get all with archived
   curl "http://localhost:3001/api/students?showAll=true"

   # Delete
   curl -X DELETE http://localhost:3001/api/students/1
   ```
2. Confirm each returns the expected status code and data shape.
3. **Design check:** No design impact for this card (API only).

## Localhost test before continuing

After this card, the learner should test:

- [ ] `POST /api/students` with valid data returns 201 and the student object
- [ ] `POST /api/students` with empty name returns 400
- [ ] `GET /api/students` returns a list (empty or with students)
- [ ] `GET /api/students/1` returns the student
- [ ] `PUT /api/students/1` updates fields
- [ ] `PATCH /api/students/1/archive` flips active flag
- [ ] `GET /api/students` excludes archived students by default
- [ ] `DELETE /api/students/1` removes the student (subsequent GET returns 404)

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If the server fails to restart after adding routes, check for syntax errors or missing imports.

## Status

Completed