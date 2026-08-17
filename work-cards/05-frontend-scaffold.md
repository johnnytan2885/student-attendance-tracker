# Work Card 05 — Frontend Scaffold

## Goal

Set up the Vite + React frontend, install dependencies, create the routing structure, global CSS with design.md style rules, and the Navbar component. Verify the dev server starts and shows the app shell.

## Inputs

- `architecture.md` — frontend directory structure, component map
- `design.md` — color/contrast rules, typography, layout rules, mobile rules
- `build-blueprint.md` — file expectations

## Files likely touched

- `frontend/package.json`
- `frontend/index.html`
- `frontend/vite.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/components/Navbar.jsx`
- `.gitignore`

## Instructions for the coding agent

1. Create the `frontend/` directory.
2. Initialize with `npm create vite@latest . -- --template react` in the frontend directory (or manually create the Vite config).
3. Install dependencies: `react-router-dom`.
4. Configure `vite.config.js` with a proxy to forward `/api` requests to `http://localhost:3001`.
5. Create `frontend/src/main.jsx` — render App with BrowserRouter.
6. Create `frontend/src/App.jsx` — set up Routes:
   - `/login` → LoginPage (placeholder component for now)
   - `/change-password` → ChangePasswordPage
   - `/dashboard` → Dashboard
   - `/students/:id` → StudentProfile
   - `/attendance` → AttendanceForm
   - `/` → redirect to `/dashboard` if authenticated, else `/login`
7. Create `frontend/src/App.css` — global styles matching design.md:
   - CSS reset/normalize basics
   - Body font: system stack, background #F8F9FA, color #1A1A2E
   - Links styled as sky blue
   - Import design system variables for primary, danger, success, warning colors
8. Create placeholder components for all pages (just a `<h1>` with the page name for now).
9. Create `frontend/src/components/Navbar.jsx` — shows app name "Student Attendance Tracker" and a Logout button (non-functional placeholder for now).
10. Add root `package.json` script for frontend: `"dev:frontend": "npm run dev --prefix frontend"`.
11. Update `.gitignore` to include `frontend/node_modules/`, `frontend/dist/`.

## What not to do

- Do not implement login/auth logic yet (Card 06)
- Do not implement API calls yet (Cards 06-09)
- Do not add full page content yet — placeholder only
- Do not add any backend code

## Done when

- `npm run dev:frontend` starts the Vite dev server
- Browser shows the app shell with Navbar at top
- Navigation between placeholder pages works (may show blank/not-found since auth isn't wired yet)
- CSS variables are defined and applied to the body
- Vite proxy forwards /api requests to backend

## Verification steps

1. Run `npm run dev:frontend` — server starts without errors
2. Open browser to the Vite URL (default http://localhost:5173)
3. Confirm the Navbar appears with app name
4. Check that CSS is applied (background color, font stack)
5. Open browser DevTools, go to Network tab, and navigate to `/login` — confirm React Router is routing (page changes, no full reload)
6. **Design check:** Global CSS uses the sky blue primary (#4A90D9 or similar), near-white background, dark charcoal text. Body font is system stack. No horizontal scroll at 320px width (check in DevTools).

## Localhost test before continuing

After this card, the learner should test:

- [ ] Frontend dev server starts on port 5173 (or available port)
- [ ] Navbar shows "Student Attendance Tracker"
- [ ] Navigating to `/login`, `/dashboard`, `/change-password` shows the placeholder page name
- [ ] Page has the correct background and font from design.md
- [ ] No horizontal scroll at 320px width in DevTools

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If Vite fails to scaffold, manually create `vite.config.js`, `index.html`, `package.json` with the correct dependencies.

## Status

Completed