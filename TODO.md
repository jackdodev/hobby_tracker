# TODO

## Milestone 1: Core App ✓
- [x] Scaffold Next.js 15 with TypeScript, Tailwind CSS 4, App Router
- [x] File-based storage (`data/tracker.json`) with `src/lib/storage.ts`
- [x] Shared layout and navigation
- [x] `/hobbies` — add and soft-delete hobbies
- [x] `/` — today's checklist with toggle per hobby
- [x] `/history` — monthly table with month navigation
- [x] `/stats` — GitHub-style full-year activity heatmap
- [x] Streak counter (current + best) on Today page
- [x] Monthly completion % column on History page

## Milestone 1.5: Hobby Types & Add Flow ✓

### Schema & Storage
- [x] Add `HobbyType`, `HobbyGoal` types to `src/types/index.ts`; extend `Hobby` with `type` + optional `goal`; add optional `value` to `LogEntry`
- [x] Update `addHobby` in `storage.ts` to accept `type` and `goal`
- [x] Replace `toggleLogEntry` with `upsertLogEntry(hobbyId, date, value?)` — sets or clears a log entry; for boolean type, presence = done (no value); for others, overwrite value
- [x] Backwards-compat read: hobbies missing `type` field default to `'boolean'`
- [x] `updateHobbyGoal(id, goal)` — edit target + unit of an existing hobby

### Presets
- [x] Create `src/lib/presets.ts` with `HOBBY_PRESETS` array (name, emoji, type, optional goal) for ~10 well-known hobbies

### Add Hobby Modal
- [x] Replace `AddHobbyForm` inline input with a modal trigger button
- [x] Build `AddHobbyModal` client component:
  - Boolean presets add immediately; non-boolean presets pre-fill the Custom form (highlighted; click again to deselect)
  - Custom form: name input, type selector, conditional goal fields (target + unit)
  - Submit → `createHobby` server action → revalidate → close modal

### Today's Achievement — Per-Type UI
- [x] `ToggleButton` — full card clickable, toggles boolean done/undone
- [x] `CounterInput` — −/+ buttons + progress bar; shows count / goal
- [x] `QuantityInput` — full card clickable, opens number input; progress bar fills to goal
- [x] `TimeInput` — full card clickable, opens start/end time pickers; progress bar fills to goal
- [x] Update `src/app/page.tsx` to render the correct component per `hobby.type`

### Hobbies Page Polish
- [x] Show colored type badge with goal summary next to each hobby name
- [x] Click non-boolean hobby row → inline edit form for `goal.target` + `goal.unit`
- [x] Removed hobbies hidden from the hobbies page

### History Page Polish
- [x] Full achievement = green `✓`; partial (entry exists but value < goal) = orange `●`
- [x] `%` column counts fully achieved days only
- [x] Removed hobbies hidden from history table

## Milestone 2: Polish & UX ✓
- [x] Active nav link highlight — `usePathname` in Nav, underline + blue on active route
- [x] Optimistic UI for toggle — `useOptimistic` in ToggleButton, instant flip with no loading flash
- [x] Empty-state copy on Today, Hobbies, and History pages
- [x] Responsive layout — `flex-wrap` on TimeInput form, 2-col preset grid on mobile
- [x] Confirm dialog before removing a hobby — inline "Remove? Yes / No" step

## Routines Feature ✓

- [x] Add `Routine` type to `src/types/index.ts`; update `TrackerData` with `routines: Routine[]`
- [x] Storage: `getActiveRoutines`, `addRoutine`, `removeRoutine`, `computeRoutineStreak`; backwards-compat `routines ?? []` on read
- [x] `src/actions/routines.ts` — `createRoutineWithHobbies` (creates hobbies + routine atomically), `deleteRoutine` server actions
- [x] `RoutineCard` — expandable card: header shows name + X/Y count + streak; body renders per-type components for each hobby
- [x] `AddRoutineModal` — name field + same preset grid as AddHobbyModal + custom form; "Add to Routine" builds pending hobby list; "Create Routine (N)" finalizes
- [x] `RoutineRow` — hobbies page list item: routine name + hobby name chips + confirm-remove button
- [x] Update `hobbies/page.tsx` — standalone hobbies section + routines section + both Add buttons
- [x] Update `page.tsx` (Today) — standalone hobbies + routine cards; completed counter counts routines too

## Milestone 3: Testing ✓
- [x] Unit tests for `src/lib/storage.ts` (add, remove, toggle, streak, daily map) — 25 tests, all passing
- [x] Unit tests for streak edge cases (no entries, single day, broken streak)
- [x] Playwright E2E: add hobby → check off today → verify history (`e2e/hobby.spec.ts`)
- [x] Playwright E2E: remove hobby → verify it disappears from hobbies page, today page, and history
- Note: E2E tests require system browser deps — run `sudo npx playwright install-deps` once on a new machine before `npm run test:e2e`

## Milestone 4: Storage Migration (for Vercel deployment)
- [x] Migrate from `data/tracker.json` to Vercel KV (Upstash)
- [x] Update `src/lib/storage.ts` — all functions async, `fs` replaced with `kv.get`/`kv.set`
- [x] All pages marked `force-dynamic`; all server actions updated with `await`
- [x] Unit tests updated to mock `@vercel/kv` instead of `fs` — 25/25 passing
- [x] Smoke test production deployment on Vercel — all 4 pages return 200 locally with KV connected
- Note: local dev requires `vercel env pull .env.local` to get `KV_REST_API_URL` + `KV_REST_API_TOKEN`

## Milestone 5: User Authentication ✓

> No real security — credentials are never validated or stored. The userId is purely a namespace key for KV data. Anyone who enters a userId gets access to that user's data.

- [x] `src/middleware.ts` — redirect unauthenticated users (no `userId` cookie) to `/login`; redirect logged-in users away from `/login` and `/signup`
- [x] `src/actions/auth.ts` — `login(formData)`: set `userId` cookie + redirect to `/`; `signup()`: redirect to `/login` (no storage); `logout()`: clear cookie + redirect to `/login`
- [x] Login page (`src/app/(auth)/login/page.tsx`) — form with userId + password fields, "Sign Up" link to `/signup`; uses minimal layout without nav
- [x] Sign up page (`src/app/(auth)/signup/page.tsx`) — form with userId + password fields; submit redirects to `/login`; same minimal layout
- [x] `src/app/(auth)/layout.tsx` — minimal layout (no nav) for auth pages
- [x] Update `storage.ts` — add `userId` to all function signatures; KV key becomes `tracker:${userId}` instead of `tracker`
- [x] Update all server actions (`hobbies.ts`, `log.ts`, `routines.ts`) — read `userId` cookie with `cookies()`, pass to storage functions
- [x] Update all pages (`/`, `/hobbies`, `/history`, `/stats`) — read `userId` cookie, pass to storage functions
- [x] Add logout button to `Nav` — form action calls `logout` server action; shows current userId

## Milestone 6: Real Authentication (Auth.js + Google OAuth) ✓

> Auth.js v5 (beta) with two providers: Google OAuth and Credentials (username/password). User is identified by `session.user.email`, which is the KV namespace key. Google login uses the Google account email; credentials login uses the typed username as the email.

### Setup
- [x] Install `next-auth@beta`
- [x] Create `src/auth.ts` — configure Auth.js with Google + Credentials providers; expose `auth`, `signIn`, `signOut`, `handlers`; JWT/session callbacks carry Google `profile.picture` → `session.user.image`
- [x] Register Google OAuth app in Google Cloud Console → get `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`
- [x] Add env vars to Vercel + `.env.local`: `AUTH_SECRET` (random string), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

### Middleware
- [x] Replace `src/middleware.ts` with Auth.js middleware — `export { auth as middleware } from '@/auth'`
- [x] Configure matcher to protect all routes except static assets and `/api/auth`

### Auth Pages & Actions
- [x] `src/actions/auth.ts` — slimmed to `logout()` only (calls `signOut({ redirectTo: '/login' })`)
- [x] `src/app/(auth)/signup/page.tsx` — redirects to `/login` (no longer needed with OAuth)
- [x] `src/app/(auth)/login/page.tsx` — username/password form + "Sign in with Google" button; inline server actions call `signIn('credentials', ...)` / `signIn('google', ...)` both with `redirectTo: '/'`
- [x] Keep `src/app/(auth)/layout.tsx` minimal layout (no nav) — reused as-is

### Session in Pages & Actions
- [x] Update all server components (`/`, `/hobbies`, `/record`, `/stats`, `/account`) — replace `cookies().get('userId')` with `(await auth())?.user?.email`
- [x] Update all server actions (`hobbies.ts`, `log.ts`, `routines.ts`) — same session read pattern
- [x] Add guard: `if (!userId) redirect('/login')` in all pages and actions

### UI Updates
- [x] Update `Nav.tsx` — shows Google profile photo if available, falls back to initials from `session.user.name`
- [x] Update `/account` page — shows real name, email, and Google profile photo from session

## Known Issues
- [ ] E2E tests reset `data/tracker.json` before each test — needs updating to reset the KV store instead (after Milestone 4 migration)

## Milestone 7: Real Username/Password Authentication ✓

> Credentials provider now validates passwords against bcrypt hashes stored in Vercel KV. Users must sign up before they can log in.

### Storage
- [x] Add `bcryptjs` (+ `@types/bcryptjs`) for password hashing
- [x] Define user record type: `{ username: string; passwordHash: string; createdAt: string }`
- [x] Add KV storage functions in `src/lib/storage.ts`:
  - `createUser(username, passwordHash)` — writes `user:${username}` key; throws if already exists
  - `getUser(username)` — reads `user:${username}`; returns null if not found

### Sign-up Flow
- [x] Restore `src/app/(auth)/signup/page.tsx` — form with username + password + confirm password fields
- [x] Add `signup` server action in `src/actions/auth.ts`:
  - Validate: username non-empty, password ≥ 8 chars, passwords match, username not already taken
  - Hash password with `bcryptjs`
  - Call `createUser(username, hash)`
  - Redirect to `/login?signup=success`
- [x] Show success banner on login page when `?signup=success` is present
- [x] Add "Sign up" link back to login page pointing to `/signup`

### Sign-in Validation
- [x] Update Credentials `authorize` in `src/auth.ts`:
  - Look up `getUser(username)`
  - If no user found → return null (Auth.js redirects to `/login?error=CredentialsSignin`)
  - Compare submitted password against `passwordHash` with `bcryptjs.compare`
  - If match → return `{ id: username, email: username, name: username }`; else → return null
- [x] Update login page error message to say "Invalid username or password" for `CredentialsSignin` error

### Notes
- KV key format: `user:${username}` (separate namespace from `tracker:${userId}`)
- Google OAuth users have no password record — they can only sign in via Google
- Passwords are never stored in plaintext — only the bcrypt hash

## Milestone 7.5: Email-based Auth + Separate Display Username ✓

> Separate the login identifier (email) from the display name (username). Login uses email for both credentials and Google OAuth; the username is a human-readable display name shown throughout the app. This also lays the groundwork for a future "forgot password" flow.

### Data Model

- `UserRecord`: `{ email: string; username: string; passwordHash: string; createdAt: string }`
- KV key: `user:${email}` (was `user:${username}`)
- Tracker namespace: `tracker:${session.user.email}` — unchanged, consistent with Google OAuth
- Session: `session.user.email` = email, `session.user.name` = display username

### Storage
- [x] Update `UserRecord` type: replace `username: string` (login id) with `email: string` + `username: string` (display)
- [x] Update `createUser(email, username, passwordHash)` — key changes to `user:${email}`
- [x] Update `getUser(email)` — look up by email

### Sign-up Flow
- [x] Update signup form: email field (top) + username field (display name) + password + confirm
- [x] Update `signup` server action: validate email format, check uniqueness by email, store `UserRecord` with both email and username
- [x] Update error codes: `email_required`, `invalid_email`, `email_taken` replace `username_required` / `username_taken`

### Sign-in
- [x] Update login form: label "Email" instead of "Username"; input `name="email"`
- [x] Update `loginWithCredentials` action: pass `email` field instead of `username`
- [x] Update Credentials provider in `src/auth.ts`: credentials field `email` instead of `username`; `authorize` looks up `getUser(email)`, returns `{ id: email, email, name: user.username }`

### Notes
- Google OAuth users get `session.user.name` from their Google profile — no `UserRecord` needed
- Credentials users: `session.user.name` comes from `UserRecord.username` via the `authorize` return value
- Nav and Account page already use `session.user.name` for display — no changes needed there

## Future Ideas

### App Features
- [ ] Year selector on Stats page (currently hardcoded to last 52 weeks)
- [ ] Per-hobby stats page (streak history, calendar view for one hobby)
- [ ] Export data as CSV
- [ ] PWA / home screen shortcut for quick daily check-in

### Achievements & Gamification
- [ ] Define achievement types (streak milestones, total completions, first log, etc.) with point values
- [ ] Compute and store earned achievements per user in KV (`achievements:${email}`)
- [ ] Achievement badge display on Account page — unlocked vs. locked
- [ ] Points total shown on Account page; leaderboard optional (future)

### Auth & Security
- [ ] **Welcome email** — send a transactional email on successful sign-up (Resend or SendGrid); include display name and a getting-started link
- [ ] **Forgot password** — "Forgot password?" link on login page → email input → send a time-limited reset token (stored in KV as `reset:${token}`) → reset link redirects to a new-password form → bcrypt hash + clear token
- [ ] **Stricter password rules** — enforce uppercase, lowercase, digit, and special character; show live strength indicator on signup form
- [ ] **JWT hardening** — set explicit `maxAge` on the Auth.js session JWT; add `jti` (JWT ID) claim for token revocation; rotate secret via `AUTH_SECRET` versioning
