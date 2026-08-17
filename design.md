# Design Direction

## Design Inspiration URL

https://designmd.ai/duanhdan/skylearn

## What We Borrow

- Sky blue as the primary anchor color (professional but friendly)
- Clean card-based layout for student items
- Warm, approachable feel adapted for adult/tutor use
- Achievement/progress indicators (adapted as credit badges)
- Generous whitespace and clear visual hierarchy

## What We Do Not Copy

- No cartoon mascots or childish illustrations
- No K-8 child-oriented language or imagery
- No sun-yellow / leaf-green used in a way that feels juvenile
- No exact fonts, logos, or branding of SkyLearn
- No copy of SkyLearn's layout structure exactly — adapt to attendance tracking

## Visual Mood

Official, premium, tutor-friendly. Clean and professional with a warm approachable accent. Trustworthy but not cold or corporate.

## Layout Rules

- Left sidebar or top nav with: Dashboard (student list), Mark Attendance, and any settings
- Main content area uses a max-width container (960px) centered
- Students displayed as cards in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Student profile page is a full-width single-column layout
- Forms appear in modals or inline panels — no full-page navigation for CRUD
- Footer minimal — just a small "Student Attendance Tracker" text

## Color / Contrast Rules

- Primary: Sky blue (#4A90D9 or similar)
- Background: Near-white (#F8F9FA)
- Card backgrounds: White (#FFFFFF) with subtle shadow
- Text: Dark charcoal (#1A1A2E) for body, medium gray (#6B7280) for secondary
- Accent for credits: A muted warm gold (#D4A843) — not bright yellow
- Danger/delete: Muted red (#D9534F)
- Absent status: Soft red background tint
- Present status: Soft green background tint
- All text meets WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text)

## Typography Feel

- System font stack (Inter, Segoe UI, system-ui, sans-serif) — no custom font loads
- Headings: semi-bold, slightly larger letter-spacing
- Body: regular weight, 16px base
- Small labels and metadata: 14px, medium gray
- Credit count: prominent, bold, displayed as a badge/pill

## Component Style

- **Buttons:** Rounded (8px border-radius), solid primary (sky blue), outlined for secondary, red for delete
- **Inputs:** Clean bordered fields with subtle focus ring, clear labels above
- **Cards:** White, rounded (12px), subtle box-shadow (0 2px 8px rgba(0,0,0,0.08)), padding 16px
- **Student card:** Shows name, credit badge, active/inactive indicator, edit/archive/delete icons
- **Attendance checkboxes:** Large enough to tap on mobile, with clear label
- **Empty state:** Centered illustration-free message + "Add your first student" CTA button
- **Navbar:** Thin bar at top with app name and logout button
- **Modal:** Centered overlay with backdrop blur, white card, close X, form inside

## Mobile Rules

- Single column layout on screens under 640px
- All tap targets minimum 44x44px
- Nav collapses to hamburger or full-width stacked menu
- Forms and modals take full screen width with padding
- Horizontal scroll never required
- Attendance grid stacks vertically per student on mobile

## Accessibility Basics

- All form inputs have associated labels
- Color is never the only indicator of status (add text label: "Present" / "Absent")
- Focus visible on all interactive elements
- Buttons have aria-label or visible text
- Error messages shown inline below inputs
- Tab order follows visual order

## Anti-Slop Rules

- No fake logos
- No fake testimonials
- No fake stats unless clearly marked sample
- No "lorem ipsum" in final proof
- One clear primary action per page (login, add student, mark attendance, etc.)
- Readable on phone width (320px minimum)
- No placeholder or skeleton content that misleads
- Student data must be real or clearly labeled demo/sample
- No hardcoded student demo data in production mode

## Design Verification Checklist

- [ ] Login page is centered, simple, with just username + password + submit
- [ ] Change password page explains it's required on first login
- [ ] Student list shows active students by default, with toggle for archived
- [ ] Each student card shows name + credit count
- [ ] Add student form is a modal or inline section
- [ ] Mark attendance page lets me pick a date + toggle present/absent per student
- [ ] Absent students show red tint, present show green tint
- [ ] Student profile shows full attendance history in a table/list
- [ ] Replacement class form available on profile
- [ ] Empty state shows when no students exist
- [ ] Delete has a confirmation dialog
- [ ] Archive hides student from main list (toggle to see archived)
- [ ] Page works and looks right at 320px width
- [ ] All buttons are tappable on mobile (44px min)
- [ ] Focus outlines visible when tabbing
- [ ] Status is communicated by text, not just color