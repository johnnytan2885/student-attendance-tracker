# Work Card 06 — Login & Auth Pages

## Goal

Implement the Login page and Change Password page. Wire them to the auth API. Implement client-side session handling (token storage) and protected routing.

## Inputs

- `architecture.md` — user flow, auth endpoints
- `design.md` — login page style, form style, color rules
- `build-blueprint.md` — proof ladder steps 4, 5, 6
- `work-cards/04-auth-api.md` — backend auth must be complete
- `work-cards/05-frontend-scaffold.md` — frontend scaffold must be complete

## Files likely touched

- `frontend/src/api/client.js` (create)
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/ChangePasswordPage.jsx`
- `frontend/src/App.jsx` (update routes with auth guard)
- `frontend/src/components/Navbar.jsx` (wire logout)

## Instructions for the coding agent

1. Create `frontend/src/api/client.js`:
   - Helper functions: `getToken()`, `setToken(token)`, `clearToken()` (use localStorage for the token)
   - `apiFetch(url, options)` — wrapper around fetch that adds `Authorization: Bearer <token>` header if token exists, handles 401 responses
   - Export `login(username, password)`, `changePassword(currentPassword, newPassword)`, `logout()`, `getMe()` functions

2. Create `frontend/src/pages/LoginPage.jsx`:
   - Centered card layout matching design.md
   - Username and password inputs with labels
   - Submit button ("Log In")
   - Error message display below form
   - On success: store token, check `mustChangePassword` flag
     - If true → redirect to `/change-password`
     - If false → redirect to `/dashboard`
   - Loading state on submit button

3. Create `frontend/src/pages/ChangePasswordPage.jsx`:
   - Explains that this is required on first login
   - Current password, new password, confirm new password inputs
   - Validation: new password >= 6 chars, confirm matches
   - On success: clear form, redirect to `/dashboard`
   - Error display
   - If user navigates here without needing to change password, redirect to `/dashboard`

4. Update `App.jsx`:
   - Create an `AuthGuard` component that checks for a token:
     - If no token → redirect to `/login`
     - If token exists → render children
   - Wrap dashboard, profile, attendance routes with `AuthGuard`
   - Redirect `/` to `/dashboard` if authenticated, `/login` if not
   - Call `getMe()` on app mount to verify token is still valid (if 401, clear token and redirect to login)

5. Update `Navbar.jsx`:
   - Show Logout button (calls logout, clears token, redirects to login)
   - Show app name link to `/dashboard`

## What not to do

- Do not add the Dashboard content yet (Card 07)
- Do not add attendance pages yet (Cards 08, 09)
- Do not store the token in cookies or sessionStorage — use localStorage
- Do not send passwords in URL params or logs

## Done when

- Login page renders with centered card layout
- Login with wrong credentials shows error message
- Login with correct credentials redirects to dashboard (or change-password if first login)
- Change password page appears on first login
- After password change, login redirects to dashboard
- Logout clears token and redirects to login
- Navigating to `/dashboard` without token redirects to `/login`

## Verification steps

1. Open frontend (http://localhost:5173) — should redirect to `/login`
2. Login with wrong credentials — see error message
3. Login with default admin (admin / admin123) — should redirect to `/change-password`
4. Set new password — should redirect to `/dashboard` (empty dashboard page is fine for now)
5. Logout — back to login page
6. Login with new password — should go directly to dashboard (no change-password screen)
7. Try accessing `/dashboard` directly without token — should redirect to `/login`
8. **Design check:** Login page follows design.md — centered card, sky blue button, proper spacing, readable at 320px width.

## Localhost test before continuing

After this card, the learner should test:

- [ ] Login page is centered, has username + password inputs and a submit button
- [ ] Wrong credentials show an error message
- [ ] Correct credentials (first login) redirect to change-password page
- [ ] Change password page validates password length and confirmation match
- [ ] After password change, redirects to dashboard
- [ ] Logout clears session and returns to login
- [ ] Subsequent login with new password goes directly to dashboard
- [ ] Accessing `/dashboard` without token redirects to login
- [ ] Login page looks good at 320px width

If all tests pass, reply `continue`.
If anything fails, reply `fix` and paste the error or describe what you see.

## Stop condition

If the backend returns unexpected response shapes, check the auth API implementation in Card 04 first.

## Status

Completed