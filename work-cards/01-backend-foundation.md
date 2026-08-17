# Work Card 01 — Backend Foundation

## Goal

Set up the Express server, SQLite database, run the initial migration to create all three tables, and seed the default admin user. Verify the server starts and the database responds.

## Inputs

- `architecture.md` — stack, data model, file structure
- `build-blueprint.md` — file expectations, data/storage rules
- `design.md` — no direct design impact for this card

## Files likely touched

- `backend/package.json`
- `backend/src/index.js`
- `backend/src/db.js`
- `backend/migrations/init.js`
- `backend/data/.gitkeep`
- `backend/.env`
- `.gitignore`
- Root `package.json`

## Instructions for the coding agent

1. Create the `backend/` directory structure.
2. Initialize `backend/package.json` with dependencies: `express`, `better-sqlite3`, `bcrypt`, `cors`, `dotenv`, plus `nodemon` as dev dependency.
3. Create `backend/.env` with `PORT=3001`, `SESSION_SECRET=<random-string>`, `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=admin123` (default credentials).
4. Create `backend/src/db.js` — open/create SQLite file at `backend/data/attendance.db`, export the db instance.
5. Create `backend/migrations/init.js` — create tables `admin`, `student`, `attendance_record` matching the data model in architecture.md. Seed one admin row with `username=admin`, `password_hash` (bcrypt of `admin123`), `must_change_password=1`.
6. Create `backend/src/index.js` — Express app with cors, json body parser, run migration on startup, listen on PORT.
7. Create `.gitignore` ignoring `node_modules/`, `.env`, `backend/data/`.
8. Create root `package.json` with a script `"dev:backend": "nodemon backend/src/index.js"`.
9. Run `npm install` in the backend directory.
10. Start the server and verify it stays running.

## What not to do

- Do not create any frontend files yet
- Do not add API routes yet (that's Card 02)
- Do not add auth middleware yet (Card 04)
- Do not hardcode or log the password hash

## Done when

- Server starts on port 3001 with no errors
- Database file `backend/data/attendance.db` is created with all three tables
- Default admin user exists in the `admin` table
- Connection works (server logs "Server running on port 3001")

## Verification steps

1. Run `npm run dev:backend` (or `node backend/src/index.js`) — server starts without crashing
2. Check that `backend/data/attendance.db` exists
3. Run a quick Node script or use `node -e` to query the database and confirm the tables exist:
   ```bash
   node -e "const db = require('./backend/src/db'); console.log(db.prepare('SELECT name FROM sqlite_master WHERE type=\\'table\\'').all())"
   ```
4. Confirm the admin user exists:
   ```bash
   node -e "const db = require('./backend/src/db'); console.log(db.prepare('SELECT username, must_change_password FROM admin').all())"
   ```
5. Send a test GET request to `http://localhost:3001/` — should get a response (200 or 404 is fine, just not a crash)
6. **Design check:** No design impact for this card (backend only).

## Localhost test before continuing

After this card, the learner should test:

- [ ] Server starts on port 3001 without errors
- [ ] `backend/data/attendance.db` exists
- [ ] Database query confirms `admin`, `student`, `attendance_record` tables exist
- [ ] Admin user is seeded with `must_change_password = 1`

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If `npm install` fails or the server crashes on startup, check Node/npm versions and fix package.json before continuing.

## Status

Completed