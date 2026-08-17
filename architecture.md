# Architecture

## Build Shape

Browser-local tool with trainer-approved backend/database expansion.

## Stack Decision

- **Frontend:** Vite + React (JavaScript/JSX)
- **Backend:** Node.js + Express
- **Database:** SQLite via better-sqlite3
- **Auth:** bcrypt for password hashing + session token (simple JWT or express-session)
- **Styling:** Plain CSS
- **Repo structure:** Monorepo with `frontend/` and `backend/` directories

## Structure Overview

```
student-attendance-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/          (fetch wrappers)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── db.js         (SQLite setup + queries)
│   │   ├── auth.js       (login, password)
│   │   └── index.js      (Express entry)
│   ├── migrations/
│   └── package.json
├── package.json          (root scripts)
└── README.md
```

## Component Map

- `LoginPage` — username/password form
- `ChangePasswordPage` — force password change on first login
- `Dashboard` — student list with add, search/filter
- `StudentCard` — single student row/card
- `StudentProfile` — full profile with attendance log + credits + replacement form
- `AttendanceForm` — pick date, mark present/absent per student
- `Modal` — reusable confirm/edit dialog
- `Navbar` — logout, app title

## Data / State Model

**Admin**
| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto |
| username | TEXT | unique |
| password_hash | TEXT | bcrypt |
| must_change_password | INTEGER (bool) | default 1 |

**Student**
| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto |
| name | TEXT | required |
| email | TEXT | optional |
| notes | TEXT | optional |
| credits | INTEGER | default 0 |
| active | INTEGER (bool) | default 1 |
| created_at | TEXT | ISO timestamp |

**AttendanceRecord**
| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto |
| student_id | INTEGER FK | references student(id) |
| date | TEXT | class date |
| status | TEXT | "present" or "absent" |
| replacement_date | TEXT | nullable, set manually |
| created_at | TEXT | ISO timestamp |

## Storage Logic

- SQLite database stored in `backend/data/attendance.db`
- Tables created via migration script on first run
- No localStorage — all data persisted via REST API to SQLite

## User Flow

1. Visit app → redirect to `/login`
2. Login with default credentials → server checks must_change_password
3. If must_change_password = true → redirect to `/change-password`
4. After password change → redirect to `/dashboard`
5. Dashboard lists active students
6. Click "Mark Attendance" → select date → checkboxes for each student
7. Submit → absent students auto-credited +1
8. Click a student → `/students/:id` shows profile, attendance history, credit balance
9. On profile → "Set Replacement" button → enter date → credit -1
10. Edit / Archive / Delete available in student list and profile

**API Endpoints**

```
POST   /api/auth/login
POST   /api/auth/change-password
GET    /api/students
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
PATCH  /api/students/:id/archive
GET    /api/students/:id/attendance
POST   /api/attendance
POST   /api/attendance/replacement
```

## File Expectations

- `backend/src/db.js` — SQLite connection, table creation, query helpers
- `backend/src/auth.js` — login, password change, session middleware
- `backend/src/routes/students.js` — CRUD + archive routes
- `backend/src/routes/attendance.js` — mark attendance + replacement routes
- `backend/src/routes/auth.js` — auth routes
- `backend/src/index.js` — Express app setup, middleware, start server
- Frontend pages/components as listed in Component Map

## Constraints

- Single admin only — no multi-user
- All dates are manually input (YYYY-MM-DD format)
- Credits are whole integers only
- No public registration or payment integration

## Technical Non-Goals

- No email notifications
- No bulk import/export
- No calendar picker widget required
- No deployment pipelines

## Verification Notes

- API test: create student via POST → GET returns student
- Attendance flow: mark student absent → GET profile shows credit = 1
- Replacement flow: set replacement → GET profile shows credit = 0
- Auth test: login with wrong password returns 401
- Password change: must_change_password flag flips to 0
- Archive: PATCH archive → student excluded from GET /api/students (active) list
- Delete: DELETE student → removed from DB entirely