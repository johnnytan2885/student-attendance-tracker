# Work Card 04 — Auth API

## Goal

Implement login, password change, and session middleware. Protect all student and attendance routes behind authentication.

## Inputs

- `architecture.md` — auth endpoints, admin data model
- `build-blueprint.md` — proof ladder steps 4, 5, 6
- `work-cards/03-attendance-api.md` — must be completed first

## Files likely touched

- `backend/src/auth.js`
- `backend/src/routes/auth.js`
- `backend/src/index.js`

## Instructions for the coding agent

1. Create `backend/src/auth.js` with helper functions:
   - `requireAuth` — Express middleware that checks for a valid session token (simple approach: use express-session, or a Bearer token stored in a simple in-memory store or a sessions table). If no valid session, return 401.
   - `createSession(adminId)` — create a session, return session token/id
   - Option: use `express-session` middleware with a SQLite session store (e.g., `better-sqlite3-session-store` or `express-session` with memory store for simplicity). If using memory store, note sessions reset on server restart — acceptable for this project.

2. Create `backend/src/routes/auth.js` with these endpoints:
   - `POST /api/auth/login` — body: `{ username, password }`. Verify credentials with bcrypt. If valid:
     - Check `must_change_password` flag
     - Create session
     - Return `{ token, mustChangePassword: true/false }`
     - If invalid, return 401
   - `POST /api/auth/change-password` — body: `{ currentPassword, newPassword }` (requires auth). Verify current password, hash new password, update admin record, set `must_change_password = 0`. Return 200.
   - `POST /api/auth/logout` — destroy session, return 200 (requires auth).
   - `GET /api/auth/me` — return current admin info (requires auth). Return `{ id, username, mustChangePassword }`.

3. Add validation: new password must be at least 6 characters.

4. Mount auth routes in `backend/src/index.js` before other routes (so auth is available).

5. Apply `requireAuth` middleware to student and attendance routes.

6. Add a public health check at `GET /api/health` that doesn't require auth.

## What not to do

- No frontend yet
- Do not store passwords in plain text
- Do not log passwords or tokens
- Do not use JWT unless you prefer — simple session is fine
- Do not add email verification or password reset

## Done when

- Login with correct credentials returns token + mustChangePassword flag
- Login with wrong credentials returns 401
- Accessing student routes without a token returns 401
- Accessing student routes with a valid token works
- Password change works and sets mustChangePassword to false
- After password change, login returns mustChangePassword: false

## Verification steps

1. Test public health endpoint:
   ```bash
   curl http://localhost:3001/api/health
   ```
2. Test login with wrong password:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"wrong"}'
   # Expect 401
   ```
3. Test login with correct password:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
   # Save the token from response
   ```
4. Test accessing students without token:
   ```bash
   curl http://localhost:3001/api/students
   # Expect 401
   ```
5. Test accessing students with token:
   ```bash
   curl http://localhost:3001/api/students -H "Authorization: Bearer <token>"
   # Expect 200
   ```
6. Test change password:
   ```bash
   curl -X POST http://localhost:3001/api/auth/change-password -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"currentPassword":"admin123","newPassword":"newpass456"}'
   ```
7. Login with new password and verify mustChangePassword is false.
8. **Design check:** No design impact for this card (API only).

## Localhost test before continuing

After this card, the learner should test:

- [ ] Login with wrong password returns 401
- [ ] Login with correct password returns token + mustChangePassword flag
- [ ] GET /api/students without token returns 401
- [ ] GET /api/students with token returns data
- [ ] Password change works with valid current password
- [ ] After password change, login shows mustChangePassword: false
- [ ] Login with old password (after change) returns 401

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If auth seems incorrect or sessions aren't persisting, check the session store configuration. A memory store is acceptable for this project.

## Status

Completed