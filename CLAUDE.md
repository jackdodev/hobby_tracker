# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal daily hobby tracker — a simple web app to log and review hobby activities each day. It has six pages:

- **Today** (`/`): Check off which hobbies were completed today. Shows a daily progress bar, current and best streak per hobby.
- **Manage Hobbies** (`/hobbies`): Add or remove hobbies. Changes here propagate to all other pages.
- **History** (`/history`): Monthly table showing every hobby's completion across each day of the month, with a monthly completion % summary column.
- **Stats** (`/stats`): GitHub-style full-year activity heatmap showing daily hobby completion intensity.
- **Account** (`/account`): User detail page. Currently shows avatar and username; planned for future profile settings.

## Tech Spec

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Icons**: `@heroicons/react` (24/outline + 24/solid)
- **Auth**: mock cookie-based session today → planned migration to Auth.js v5 (`next-auth@beta`) with Google OAuth
- **Storage**: Vercel KV (Upstash Redis) via `@vercel/kv`
- **Unit Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Deployment**: Vercel

## Architecture

[introduce architecture with mermaid diagram]

## Routines

A routine is a named group of hobbies tracked together (e.g. "Morning Routine" = Meditation + Stretching + Journaling). Hobbies belonging to a routine are created during the routine setup — they are stored as regular `Hobby` objects in `tracker.json` but are associated with the routine via `hobbyIds`.

- Hobbies inside a routine are **hidden from the standalone list** on Today and Hobbies pages; they only appear inside the routine card.
- A routine is **complete** when every hobby in it is fully achieved for the day.
- Routines have their own **streak** (consecutive days all hobbies were complete).
- A hobby can only belong to one active routine at a time.

### Routine Card (Today page)

```
[▼] Morning Routine    2 / 3    🔥 4d
     ├ Meditation       ← ToggleButton
     ├ Stretching       ← ToggleButton
     └ Reading  5/20p  ← CounterInput
```

The card collapses/expands on click. When all hobbies are done the card turns green.

## Hobby Types

Every hobby has one of four tracking types. The type determines both the UI shown on the Today page and what gets stored in the log entry.

| Type | Example | Today UI | Logged value |
|------|---------|----------|--------------|
| `boolean` | Journaling, Cold shower | Checkbox toggle (done / not done) | none (presence = done) |
| `quantity` | Drink 2L water | Progress bar + number input (tap to log amount) | amount in `goal.unit` (e.g. ml) |
| `counter` | Read 20 pages | +/− buttons showing count / goal | count (e.g. pages) |
| `time` | Work out 60 min | Start/end time picker → elapsed duration | duration in minutes |

For `quantity`, `counter`, and `time`, the hobby stores a `goal` (target + unit). A log entry is considered **complete** when `value >= goal.target`.

### Well-Known Hobby Presets

A curated list of common hobbies with preset type and goal configs, shown in the Add Hobby modal. Stored as a static constant in `src/lib/presets.ts`.

```ts
type HobbyPreset = {
  name: string
  emoji: string
  type: HobbyType
  goal?: HobbyGoal
}
```

Example presets:
- Meditation — `time`, 10 min
- Reading — `counter`, 20 pages
- Drink Water — `quantity`, 2000 ml
- Exercise — `time`, 60 min
- Running — `time`, 30 min
- Journaling — `boolean`
- Cold Shower — `boolean`
- Coding — `time`, 120 min
- Stretching — `time`, 15 min
- Walking — `time`, 30 min

## Features

### 1. Manage Hobbies

A page to add and remove the hobbies being tracked. Changes here immediately affect the Today and History pages.

**Pages**
- `/hobbies` — manage the hobby list

**Flow**

```
[/hobbies]
  └─ Read active hobbies from tracker.json
  └─ Render active hobby list (name + type badge with goal summary)
       └─ Click non-boolean hobby row → inline edit form for target + unit
  └─ "Add hobby" button → opens AddHobbyModal
  └─ "Add routine" button → opens AddRoutineModal
       └─ Routine name input at top
       └─ "Added Hobbies" pending list (shows hobbies staged so far, each removable)
       └─ Same preset grid as AddHobbyModal (emoji + name):
            └─ Boolean preset → added to pending list immediately
            └─ Non-boolean preset → pre-fills the custom form below (highlighted; click again to deselect)
       └─ Custom hobby form (same as AddHobbyModal): name + type + goal fields
            └─ "Add to Routine" button → appends to pending list, resets form
       └─ "Create Routine (N)" button → calls `createRoutineWithHobbies`:
            creates all pending hobbies as Hobby objects, then creates Routine with their IDs
  └─ Routines section: list of active routines (name + hobby names) + Remove button
  └─ Remove button on each hobby → soft-delete (set removedAt in tracker.json)
```

**Key Details**
- Only active hobbies are shown; removed hobbies are hidden from this page
- Removing soft-deletes via `removedAt` — data is preserved in storage but not displayed
- Non-boolean hobby rows are clickable to edit `goal.target` and `goal.unit` inline
- Each hobby row shows a colored type badge with the goal summary (e.g. "Counter · 20 pages")

### 2. Today's Achievement

The home page. Shows all active hobbies as a checklist for today. User clicks a hobby to toggle it as achieved.

**Pages**
- `/` — today's achievement checklist

**Flow**

```
[/]
  └─ Read all active hobbies from tracker.json
  └─ Read log entries for today from tracker.json
  └─ Standalone hobbies (not in any active routine): per-type component
       └─ boolean  → ToggleButton  (full card clickable, toggles done/undone)
       └─ quantity → QuantityInput  (full card clickable, opens number input + progress bar)
       └─ counter  → CounterInput   (−/+ buttons, progress bar, shows count / goal)
       └─ time     → TimeInput      (full card clickable, opens start/end time pickers + progress bar)
  └─ Routines: RoutineCard per routine
       └─ Click card header to expand/collapse
       └─ Expanded: renders per-type component for each hobby in the routine
       └─ Complete when all hobbies are fully achieved → card turns green
  └─ Any interaction → upsert log entry with value → write tracker.json
```

**Key Details**
- Only active hobbies are shown (removed hobbies do not appear here)
- One log entry per hobby per date; updating a value overwrites the existing entry
- `boolean` entry: no value stored — presence = done, absence = not done
- `quantity/counter/time` entry: `value` field stores the logged amount; considered complete when `value >= goal.target`
- No date navigation — this page is always today
- Each hobby row shows its **current streak** (consecutive days ending today) and **best streak** (longest run ever)

### 3. History

A monthly table showing completion status for every hobby across every day of the selected month.

**Pages**
- `/history` — monthly tracker table (defaults to current month)
- `/history?month=YYYY-MM` — specific month view

**Layout**

```
         | 1 | 2 | 3 | 4 | ... | 31 |  %   |
---------|---|---|---|---|-----|----| -----|
Reading  | ✓ |   | ● | ✓ | ... |    | 50%  |
Guitar   |   | ✓ |   | ✓ | ... | ✓  | 42%  |
Journaling | ✓ | ✓ |   | ✓ | ... |   | 57%  |
```

- Rows = active hobbies only
- Columns = days of the selected month (1–28/29/30/31)
- Cell = `✓` (green, fully achieved) | `●` (orange, partially achieved) | blank (no entry)
- `%` column = fully achieved days ÷ days in month

**Flow**

```
[/history]
  └─ Determine selected month (default: current month)
  └─ Read active hobbies from tracker.json
  └─ Read all log entries for the selected month from tracker.json
  └─ Render table: for each hobby × day, look up entry and determine status:
       └─ boolean: entry present → full; absent → none
       └─ quantity/counter/time: value >= goal.target → full; value < target → partial; no entry → none
  └─ Month navigation (previous / next)
```

**Key Details**
- Only active hobbies are shown; removed hobbies are hidden
- Full achievement = green `✓`; partial = orange `●`; `%` column counts fully achieved days only
- Month navigation allows browsing any past month

### 4. Stats

A full-year activity heatmap inspired by GitHub's contribution graph.

**Pages**
- `/stats` — yearly heatmap (defaults to current year)

**Layout**

```
     Jan  Feb  Mar  Apr  ...  Dec
Mon  [ ]  [█]  [ ]  [░]  ...  [█]
Wed  [░]  [ ]  [█]  [█]  ...  [ ]
Fri  [█]  [░]  [ ]  [ ]  ...  [░]
```

- Each cell = one day; color intensity reflects how many hobbies were completed (0 = empty, partial = light green, all = dark green)
- Columns = weeks (left to right = oldest to newest)
- Rows = day of week (Mon–Sun)
- Tooltip or label on hover shows the date and count

**Flow**

```
[/stats]
  └─ Read all log entries from tracker.json
  └─ Group entries by date → count hobbies completed per day
  └─ Read total active hobby count (for intensity scale)
  └─ Render 52-week × 7-day grid
       └─ Color each cell by completion ratio (0, low, mid, high, full)
```

**Key Details**
- Gives a long-term consistency view at a glance
- Color scale is relative to total active hobbies at time of rendering (removed hobbies excluded from denominator)

### 5. Account

A personal stats dashboard for the logged-in user. Accessible via the circular avatar button in the nav (desktop top-right, mobile 5th tab).

**Pages**
- `/account` — user stats and logout

**Layout**

```
[Avatar initials]
username
Tracking since {month year}

[ Days tracked ]  [ Completions ]  [ Active hobbies ]

Top Streaks
  1. Meditation    🔥 12d   best 14d
  2. Reading       🔥  7d   best  7d
  ...

[ Log out ]
```

**Flow**

```
[/account]
  └─ Read active hobbies + all log entries
  └─ Compute all-time summary:
       └─ Days tracked = unique dates with any log entry
       └─ Completions = entries where hobby is fully achieved
       └─ Active hobbies = count of hobbies with removedAt === null
       └─ Tracking since = earliest log entry date
  └─ Compute streak per active hobby → sort by current streak desc
  └─ Render avatar, summary cards, streak list, logout button
```

**Key Details**
- Logout button lives here — removed from the nav to keep it clean
- Completions counts goal-based entries where `value >= goal.target`; boolean entries always count
- Streaks show top 5 active hobbies ranked by current streak (ties broken by best streak)
- If no log entries yet, "tracking since" is omitted

## UI Design System

### Principles

1. **Mobile-first responsive** — bottom tab navigation on mobile (`< md`), top nav on desktop (`md+`). All touch targets `min-h-[44px]`. Full-width on mobile, `max-w-2xl` centered on desktop.
2. **Easy to use** — primary actions clearly visible; one-tap logging; confirmations only for destructive actions; no hidden gestures.
3. **Neat and simple** — generous whitespace, minimal visual noise, max 2 accent colors per screen. Prefer icons alongside text for quick scanning.
4. **Coherent** — shared design tokens (colors, radius, spacing) used consistently across all pages and components. Every card looks like it belongs to the same system.
5. **Creative** — personality through thoughtful details: smooth transitions on done states, engaging empty states, subtle visual feedback on interaction.

### Color Palette

| Role | Tailwind tokens | Usage |
|------|----------------|-------|
| Primary / CTA | `indigo-500`, `indigo-600` | Buttons, active nav, focus rings |
| Success | `emerald-500`, `emerald-600` | Completed items, streaks, progress fill |
| Warning | `amber-500` | Partial completion |
| Destructive | `rose-500`, `rose-600` | Remove / delete actions |
| Neutral base | `slate-50` → `slate-900` | Page bg, text, borders, secondary |
| Card background | `white` | All card surfaces |

**Hobby type badges:**
- `boolean` → `slate-100 / slate-600`
- `counter` → `indigo-100 / indigo-700`
- `quantity` → `cyan-100 / cyan-700`
- `time` → `violet-100 / violet-700`

### Typography

| Role | Classes |
|------|---------|
| Page title | `text-2xl font-bold text-slate-900` |
| Section label | `text-xs font-semibold text-slate-400 uppercase tracking-widest` |
| Hobby name | `text-sm font-medium text-slate-800` |
| Meta / secondary | `text-xs text-slate-500` |
| Badge text | `text-xs font-medium` |

### Spacing & Shape

- **Page padding**: `px-4 py-6` (mobile) / `px-0 py-8` (desktop, content fills max-w)
- **Card radius**: `rounded-2xl`
- **Badge / pill**: `rounded-full`
- **Gap between cards**: `gap-3`
- **Card inner padding**: `px-4 py-3`
- **Shadow**: `shadow-sm` on cards (not borders-only)

### Responsive Strategy

- Breakpoint split: `md` (≥ 768 px) separates mobile from desktop
- **Navigation**:
  - Mobile: `fixed bottom-0` tab bar with icon + label for each route; body has `pb-20` to avoid overlap
  - Desktop (`md+`): horizontal top nav bar (current pattern, refined)
- **Modals**:
  - Mobile: slide-up bottom sheet (`fixed bottom-0 rounded-t-3xl w-full`)
  - Desktop (`md+`): centered overlay modal (current pattern)
- **Content width**: `w-full max-w-2xl mx-auto` on all pages

### Nav Icons

| Route | Icon (Heroicons outline) |
|-------|--------------------------|
| Today (`/`) | `HomeIcon` |
| Hobbies (`/hobbies`) | `ListBulletIcon` |
| History (`/history`) | `CalendarDaysIcon` |
| Stats (`/stats`) | `ChartBarIcon` |

## Data Storage

All data is stored in a single JSON file at `data/tracker.json`.

### Schema

```ts
type Routine = {
  id: string        // uuid
  name: string
  hobbyIds: string[]   // ordered list of hobby IDs; only active hobbies should be included
  createdAt: string    // ISO 8601
  removedAt: string | null
}

type TrackerData = {
  hobbies: Hobby[]
  routines: Routine[]
  logEntries: LogEntry[]
}

type HobbyType = 'boolean' | 'quantity' | 'counter' | 'time'

type HobbyGoal = {
  target: number  // e.g. 2000 (ml), 20 (pages), 60 (minutes)
  unit: string    // e.g. 'ml', 'pages', 'min'
}

type Hobby = {
  id: string              // uuid
  name: string
  createdAt: string       // ISO 8601
  removedAt: string | null  // null = active
  type: HobbyType         // defaults to 'boolean' for pre-existing entries
  goal?: HobbyGoal        // present for quantity/counter/time; absent for boolean
}

type LogEntry = {
  hobbyId: string   // references Hobby.id
  date: string      // YYYY-MM-DD
  value?: number    // absent for boolean; quantity/counter = amount; time = minutes elapsed
}
```

### Example

```json
{
  "hobbies": [
    { "id": "a1b2c3", "name": "Reading", "createdAt": "2026-04-01T00:00:00Z", "removedAt": null, "type": "counter", "goal": { "target": 20, "unit": "pages" } },
    { "id": "b2c3d4", "name": "Drink Water", "createdAt": "2026-04-01T00:00:00Z", "removedAt": null, "type": "quantity", "goal": { "target": 2000, "unit": "ml" } },
    { "id": "c3d4e5", "name": "Journaling", "createdAt": "2026-04-01T00:00:00Z", "removedAt": null, "type": "boolean" },
    { "id": "d4e5f6", "name": "Running", "createdAt": "2026-04-01T00:00:00Z", "removedAt": "2026-04-20T00:00:00Z", "type": "time", "goal": { "target": 30, "unit": "min" } }
  ],
  "logEntries": [
    { "hobbyId": "a1b2c3", "date": "2026-04-24", "value": 15 },
    { "hobbyId": "b2c3d4", "date": "2026-04-24", "value": 1800 },
    { "hobbyId": "c3d4e5", "date": "2026-04-24" },
    { "hobbyId": "d4e5f6", "date": "2026-04-10", "value": 35 }
  ]
}
```

**Notes**
- All reads and writes go through `src/lib/storage.ts`, which handles file I/O and JSON parsing
- Writes use an atomic read-modify-write pattern to avoid data loss
- `logEntries` has no id — `(hobbyId, date)` is the natural unique key
- Hobbies are soft-deleted via `removedAt`; active = `removedAt === null`
- `data/tracker.json` is committed to the repo as the source of truth; seed it as `{ "hobbies": [], "logEntries": [] }`
- Existing `boolean`-style hobbies (no `type` field) are treated as `type: 'boolean'` at read time for backwards compatibility

## Authentication

### Current (mock)
- `src/middleware.ts` — redirects unauthenticated requests (no `userId` cookie) to `/login`; redirects logged-in users away from auth pages
- `src/actions/auth.ts` — `login()` sets a `userId` cookie with whatever username is typed (no validation); `logout()` clears it
- Auth pages live in `src/app/(auth)/` route group with a minimal no-nav layout
- **No real security** — the password field is ignored; anyone who knows a userId string can access that user's data

### Planned: Auth.js v5 + Google OAuth (Milestone 6)
- Install `next-auth@beta`; create `src/auth.ts` exporting `auth`, `signIn`, `signOut`, `handlers`
- Middleware becomes `export { auth as middleware } from '@/auth'`
- Login page replaced with a "Sign in with Google" button
- All pages and server actions read user identity from `(await auth()).session?.user?.email` instead of the `userId` cookie
- KV namespace key changes from typed username → Google account email
- Required env vars: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

## Deployment Plan

**Platform**: Vercel Hobby (Free)

**Flow**
```
Push to main
  └─ Vercel auto-detects Next.js
  └─ Runs npm run build
  └─ Deploys to production URL
```

**Notes**
- Storage uses Vercel KV (Upstash). Env vars `hb_KV_REST_API_URL` and `hb_KV_REST_API_TOKEN` are required at runtime.
- For local dev, run `vercel env pull .env.local` once to pull credentials from the Vercel project.
- The `hb_` prefix on env vars comes from the KV store's name in the Vercel dashboard — `storage.ts` uses `createClient` with those exact names.

## Pre-commit actions

## Code Conventions

### Naming
- Components: `PascalCase` (`HobbyCard.tsx`)
- Files/folders: `kebab-case` (`hobby-card.tsx`) — Next.js App Router convention
- Variables/functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types: `PascalCase`, prefer `type` over `interface`

### File Structure
```
src/
├── app/                  # App Router pages and layouts
│   ├── account/          # /account — user detail page
│   ├── history/          # /history — monthly table
│   │   └── components/   # MonthNav
│   ├── hobbies/          # /hobbies — manage hobbies
│   │   └── components/   # HobbyRow, AddHobbyModal, AddRoutineModal, …
│   ├── stats/            # /stats — yearly heatmap
│   ├── components/       # Today-page components (ToggleButton, CounterInput, …)
│   ├── layout.tsx
│   ├── page.tsx          # / — today page
│   └── globals.css
├── components/           # Shared components (Nav)
├── actions/              # Server Actions
├── lib/
│   ├── storage.ts        # All KV read/write logic (async)
│   └── presets.ts        # Static HOBBY_PRESETS list
└── types/                # Shared TypeScript types
e2e/                      # Playwright E2E tests
```

### TypeScript
- No `any` — use `unknown` if type is uncertain
- Prefer `type` over `interface`
- Always type return values for Server Actions and lib functions

### Components
- Default to Server Components; add `"use client"` only when necessary
- Keep components small and single-purpose
- Define props type inline above the component

### Imports
- Always use `@/` path alias, never relative `../../`
- Order: external libs → internal `@/` → types

### Server Actions
- All mutations go through Server Actions, not API routes
- Name with verb prefix: `createHobby`, `deleteHobby`, `editHobbyGoal`, `upsertLog`, `createRoutineWithHobbies`, `deleteRoutine`

### Tailwind
- No inline `style` props — use Tailwind classes only
- Extract repeated class combinations into components, not `@apply`

## Test Plan

### Unit Tests (Vitest)
- `src/lib/storage.test.ts` — 25 tests covering all storage functions
- Mock: `@vercel/kv` is mocked with an in-memory store (`kv.get` returns `store`, `kv.set` writes to `store`)
- Run: `npm test`

### E2E Tests (Playwright)
- `e2e/hobby.spec.ts` — 2 tests: add→check→verify history, add→remove→verify gone
- Currently resets `data/tracker.json` before each test — needs updating to reset KV store after Milestone 4 migration
- Run: `npm run test:e2e` (requires `sudo npx playwright install-deps` once per machine)

## Critical Conventions

This is a **Next.js App Router** project using TypeScript and Tailwind CSS 4.

- **Source root**: `src/`
- **Path alias**: `@/*` maps to `./src/*`
- **Routing**: File-based via `src/app/` directory (App Router)
- **Styling**: Tailwind CSS 4 via `@tailwindcss/postcss` — import with `@import "tailwindcss"` in CSS, no config file needed
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font/google` in `layout.tsx`, exposed as CSS variables (`--font-geist-sans`, `--font-geist-mono`)
- **Dark mode**: CSS variables (`--background`, `--foreground`) toggled via `prefers-color-scheme` media query in `globals.css`

## Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm test           # Run Vitest unit tests (src/lib/storage.test.ts)
npm run test:watch # Run Vitest in watch mode
npm run test:e2e   # Run Playwright E2E tests (requires: sudo npx playwright install-deps)
```

### First-time E2E setup

```bash
sudo npx playwright install-deps   # Install system browser libraries (once per machine)
npx playwright install chromium    # Download browser binary
```
