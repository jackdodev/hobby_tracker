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

## Known Issues
- [ ] E2E tests reset `data/tracker.json` before each test — needs updating to reset the KV store instead (after Milestone 4 migration)

## Future Ideas
- [ ] Year selector on Stats page (currently hardcoded to last 52 weeks)
- [ ] Per-hobby stats page (streak history, calendar view for one hobby)
- [ ] Export data as CSV
- [ ] PWA / home screen shortcut for quick daily check-in
