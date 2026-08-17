# Project Brief

## Project Identity

Student Attendance Tracker

## One-Sentence Concept

A private admin-only web app for a tutor to register students, record daily attendance with automatic credit tracking for missed classes, and manage replacement sessions — all protected by a login system.

## Target User

A private tutor managing 10–25 students.

## User Goal

Log in, add and manage student profiles, mark attendance by date, automatically credit students for absences, schedule replacement classes that consume credits, and archive or remove student records.

## Build Shape

Browser-local tool with trainer-approved backend/database expansion.

## Shape Confirmation

Confirmed by learner. Trainer approved backend/database (no localStorage).

## Version-One Success

The admin can:
- Log in with an initial password and change it on first login.
- Add, view, edit, archive, and permanently delete student records.
- See each student's profile with their attendance history and credit balance.
- Manually input a class date and mark each student present or absent.
- Automatically grant 1 class credit upon marking a student absent.
- Set a replacement class date for a student, consuming 1 credit.
- Archive inactive students to hide them from the active list.
- Remove students entirely when needed.

## Now / Later / Never

### Now

- Admin login with first-login password change
- Student CRUD (add, view, edit, archive, delete)
- Student profile page with attendance log and credit balance
- Manual date-based attendance marking (present / absent)
- Auto-credit 1 on absence
- Replacement class scheduling that consumes 1 credit
- Backend + database (trainer approved)

### Later

- Export reports or attendance summaries
- Email notifications
- Bulk import students

### Never

- Payment integration
- Public registration or multi-user roles

## Assumptions

- Single admin only (no multi-user)
- Dates are entered manually (no calendar picker requirement assumed)
- Credits are whole numbers, one per absence
- The trainer will specify the stack (frontend, backend, database)

## Proof Target

The admin can log in, add a student, mark them absent, see the credit increment, schedule a replacement class, and confirm the credit decrement — all through the app.

## Trainer / Learner Notes

Backend/database expansion approved by trainer. No localStorage.