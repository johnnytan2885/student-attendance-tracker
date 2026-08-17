# Build Blueprint

## Source Files

- `project-brief.md` — identity, scope, success target
- `architecture.md` — stack, structure, data model, API, user flow
- `design.md` — SkyLearn inspiration, style rules, mobile, accessibility

## Project Identity

**Student Attendance Tracker** — a private admin-only web app for a tutor.

## Build Shape

Browser-local tool with trainer-approved backend/database expansion.

## Version-One Promise

The admin can log in (with forced password change on first login), add/view/edit/archive/delete students, mark attendance by date with auto-crediting on absences, and schedule replacement classes that consume credits. All data persists in SQLite via a REST API.

## Scope Lock

### Now

- Admin login with first-login password change (bcrypt + session)
- Student CRUD (add, view, edit, archive, delete)
- Student profile page with attendance log and credit balance
- Manual date-based attendance marking (present / absent)
- Auto-credit 1 on absence
- Replacement class scheduling consuming 1 credit
- Vite + React frontend, Express + SQLite backend

### Later

- Export reports
- Email notifications
- Bulk import

### Never

- Payment integration
- Public registration or multi-user roles

## Architecture Summary

| Layer | Technology |
|---|---|
| Frontend | Vite + React (JavaScript) |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Auth | bcrypt + session tokens |
| Styling | Plain CSS (no framework) |
| Repo | Monorepo: `frontend/` + `backend/` |

## Data / State / Storage Rules

Three tables: `admin`, `student`, `attendance_record`.

- **admin**: id, username, password_hash, must_change_password (boolean)
- **student**: id, name, email (optional), notes (optional), credits (default 0), active (default true), created_at
- **attendance_record**: id, student_id (FK), date, status ("present"|"absent"), replacement_date (nullable), created_at

All persistence via REST API → Express → SQLite. No localStorage. No client-side state beyond React component state and fetch results.

## Design Direction Summary

**Borrow from SkyLearn:** Sky blue primary, clean card layout, warm approachable feel, generous whitespace, clear hierarchy.

**Do not copy:** Cartoon mascots, childlike imagery, bright yellow/green used juvenile-ly, exact fonts/logos/layout.

**Mood:** Official, premium, tutor-friendly. Professional with warm accent.

**Key rules:** 960px max-width container, responsive grid (1/2/3 cols), card-based student list, modals for forms, no horizontal scroll, 44px min tap targets, color + text for status indicators, WCAG AA contrast.

## Implementation Rules

- Follow the file structure in architecture.md exactly
- Build backend first (database, models, API routes), then frontend
- One work card at a time — no jumping ahead
- Run verification steps after each work card before moving on
- Do not add features outside the scope lock
- Do not commit or push until Ship phase
- Use plain CSS only — no Tailwind, no CSS-in-JS
- No hardcoded demo data in production mode

## File and Folder Expectations

```
student-attendance-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── StudentCard.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ChangePasswordPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── StudentProfile.jsx
│   │   │   └── AttendanceForm.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   └── attendance.js
│   │   ├── db.js
│   │   ├── auth.js
│   │   └── index.js
│   ├── migrations/
│   │   └── init.js
│   ├── data/
│   ├── package.json
│   └── .env
├── package.json (root)
└── .gitignore
```

## Work Card Plan

1. **01 Backend Foundation** — Express server, SQLite setup, migration (admin table + seed default admin), server starts
2. **02 Student API** — Student CRUD + archive routes
3. **03 Attendance API** — Mark attendance, auto-credit, replacement class routes
4. **04 Auth API** — Login, password change, session middleware
5. **05 Frontend Scaffold** — Vite + React setup, routing, global CSS, navbar
6. **06 Login & Auth Pages** — LoginPage, ChangePasswordPage, client-side auth
7. **07 Dashboard & Student CRUD** — Student list, add/edit/archive/delete with modals
8. **08 Attendance Marking** — Date picker + present/absent toggles per student
9. **09 Student Profile** — Profile page, attendance log, credit display, replacement form
10. **10 Polish & Integration** — Error handling, empty states, mobile check, final integration test

## Review Mirror

Before marking any work card done:

- Does the new code match the architecture and design rules?
- Are there no unused imports, dead code, or console.logs left in?
- Does the component handle loading, error, and empty states?
- Is the mobile layout acceptable at 320px?
- Are colors and text both used to convey status?
- Does the API return proper HTTP status codes (200, 201, 400, 401, 404)?
- Is the database schema consistent with the data model?

## Proof Ladder

1. `GET /api/students` returns empty array → add student → `POST /api/students` → `GET /api/students` returns the new student
2. Mark student absent → `GET /api/students/:id` shows credits = 1
3. Set replacement → `GET /api/students/:id` shows credits = 0
4. Login with wrong password → 401
5. Login with correct password → 200, then forced to change password
6. Change password → subsequent login works with new password
7. Archive student → `GET /api/students` excludes archived student
8. Delete student → `GET /api/students/:id` returns 404
9. Full flow in browser: login → add student → mark absent → see credit → set replacement → see credit decrement

## 60-Second Explanation Template

"This is a private attendance tracker for a tutor. Admin logs in, adds students, marks them present or absent each class date. Absences auto-grant 1 credit. The tutor can schedule a replacement class that spends the credit. Built with React + Express + SQLite."

## Guardrails for the Coding Agent

- read `build-status.md`, `build-blueprint.md`, and the current work card before editing;
- implement only the current work card;
- do not jump ahead;
- stop after verification;
- update `build-status.md` after each work card;
- backend + auth + database are explicitly allowed (trainer approved);
- do not add secrets or keys to code;
- do not invent claims, testimonials, logos, or real numbers;
- apply the guardrails for the confirmed build shape (browser-local tool with backend);
- plain CSS only — no utility framework;
- no localStorage.