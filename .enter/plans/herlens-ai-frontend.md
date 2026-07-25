# HerLens AI — Frontend Build Plan

## Context
Build the full HerLens AI frontend (11 screens) matching the provided Figma
screenshots, wired to an **already-deployed** Convex backend (no `convex/`
folder exists in this repo — it lives only in the remote deployment). Since
this repo has no `convex/_generated/api`, all backend calls must use
`anyApi` from `convex/server` (no codegen). Since this platform's guidelines
forbid `VITE_*`/env-based config, the Convex deployment URL will be hardcoded
as a constant instead of read from an env variable.

Screens, mapped from the 10 attached screenshots + 1 non-screenshotted screen:
1. Auth (splash hero + Sign In/Create Account) — image 10
2. Onboarding — image 9
3. Home — image 8
4. Log Symptoms — image 7
5. Processing ("AI is Analyzing") — image 6
6. Insights — image 5
7. Doctor Timeline — image 4
8. History (heatmap) — image 3
9. Profile — image 2
10. Doctor Dashboard — image 1
11. AI Architecture — **no screenshot provided**; will be built in the same
    visual language (cards, icons, connector lines) per the written spec only
    (Convex Database + two Claude agent steps).

## Key Technical Decisions
- **Convex wiring**: `convex` package installed; `src/lib/convex-client.ts`
  exports a `ConvexReactClient` built from a hardcoded constant
  `CONVEX_URL = "https://joyous-bloodhound-547.convex.cloud"` (no env vars).
  `main.tsx` wraps `<App />` in `<ConvexProvider client={convexClient}>`.
- **No codegen**: `src/lib/convex-client.ts` also exports `api = anyApi` from
  `convex/server`. All `useQuery`/`useMutation`/`useAction` calls reference
  `api.users.getUser`, `api.aiAgents.runDualAgentAnalysis`, etc. `convex/` is
  never created or touched.
- **Typed shapes**: `src/types/health.ts` defines local TS interfaces (User,
  HealthProfile, SymptomLog, CycleDayPhase, AiInsight, TimelineEntry,
  HealthRecord) since `anyApi` calls return `any` — query results are cast to
  these interfaces at the call site for type-safe components.
- **Session**: `src/context/session-context.tsx` holds `userId` (+ whether the
  user is brand-new, to decide Onboarding vs Home after auth) in React
  context, persisted to `localStorage` so a preview refresh doesn't log the
  user out. `src/components/session/require-session.tsx` redirects to `/` if
  no `userId` is set, wrapping all protected routes.
- **Design system**: extend `index.css`/`tailwind.config.ts` with a violet
  "primary" (matches the purple gradient hero/buttons), plus new semantic
  tokens `pain`, `energy`, `mood`, `sleep`, `success`, `warning` (each with a
  soft/10% background + solid icon color) used for the overview cards, chips,
  and status badges — no hardcoded hex/white/black classes in components.
- **Mobile app shell**: `src/components/layout/app-shell.tsx` recreates the
  centered rounded "phone card" look from the screenshots (max-w-sm, white
  card, soft lavender page background) shared by every screen.
  `src/components/layout/bottom-nav.tsx` renders the 5-tab nav (Home, History,
  Insights, Doctor, Profile) exactly as in the screenshots; Log, Processing,
  Timeline, Auth, Onboarding, and Architecture are full-screen flows without
  the bottom nav (matches screenshots).
- **Honesty adjustments already specified by the user** (Profile: no
  Premium/Accuracy/Active badges; Doctor Dashboard: no Risk Level, no DoB).
  Applying the same principle to **Timeline**: the mock's "4 Verified / 2
  Contradicted / 1 Pending" pill row has no backend equivalent from
  `getSymptomTimeline` (which returns one `{monthLabel, severityTrend,
  keySymptom}` entry per month) — it will be replaced with a factual "N
  months tracked" line, keeping the diagnosis disclaimer banner verbatim.
- **Architecture screen entry point**: since it isn't in the bottom nav, add
  a small "How it works" link in the Insights header (next to the pattern
  count) that navigates to `/architecture`, with a back button returning to
  Insights.

## Files to Add/Change
- `src/lib/convex-client.ts` — Convex client + `api` (anyApi) export
- `src/types/health.ts` — shared TS interfaces for backend data
- `src/context/session-context.tsx` — session provider/hook
- `src/components/session/require-session.tsx` — auth-gate wrapper
- `src/components/layout/app-shell.tsx`, `bottom-nav.tsx`, `page-header.tsx`
- `src/pages/auth/index.tsx`
- `src/pages/onboarding/index.tsx` (+ `onboarding-data.ts`)
- `src/pages/home/index.tsx` (+ `overview-card.tsx`)
- `src/pages/log-symptoms/index.tsx` (+ `symptom-chip.tsx`, `symptom-options.ts`)
- `src/pages/processing/index.tsx`
- `src/pages/insights/index.tsx` (+ `insight-card.tsx`)
- `src/pages/timeline/index.tsx`
- `src/pages/history/index.tsx` (+ `symptom-heatmap.tsx`)
- `src/pages/profile/index.tsx`
- `src/pages/doctor/index.tsx`
- `src/pages/architecture/index.tsx`
- `src/router.tsx` — register all routes, wrap protected ones in `RequireSession`
- `src/main.tsx` — add `ConvexProvider`
- `src/App.tsx` — add `SessionProvider`
- `src/index.css`, `tailwind.config.ts` — new design tokens
- `package.json` — add `convex` dependency

## Screen Notes (backend calls)
- **Auth**: `useQuery(api.users.getUserByEmail)` on submit; if null, show
  inline name/age/phone fields and call `useMutation(api.users.createUser)`;
  store returned `_id` + "isNewUser" flag in session, then route accordingly.
- **Home**: `api.cycles.getCycleDayAndPhase`, `api.symptomLogs.listSymptomLogs`
  (limit 1) → Pain = avg of `severities` values, Energy/Mood/Sleep straight
  from the log fields; empty state if no logs yet.
- **Log Symptoms**: local multi-select state → one severity slider applied to
  all selected symptoms → `useMutation(api.symptomLogs.createSymptomLog)` →
  navigate to `/processing`.
- **Processing**: `useAction(api.aiAgents.runDualAgentAnalysis)` fired on
  mount; animated 4-step checklist runs on a timer in parallel; navigate to
  `/insights` once both the action resolves and the minimum animation time
  has elapsed.
- **Insights**: `api.aiInsights.getAiInsightsByUserId`; badge color by
  `status`; confidence → `<Progress>`; `evidenceCount` → "N Similar Logs";
  `agentDebateSummary` behind a per-card "View agent debate" toggle.
- **Doctor Timeline**: `api.symptomTimeline`... i.e.
  `api.symptomLogs.getSymptomTimeline`, grouped by `monthLabel`, disclaimer
  banner kept verbatim.
- **History**: `api.symptomLogs.getMonthlySymptomHistory` for the current
  year/month, aggregated client-side by day-of-month (count of logs, 4-step
  color scale) for the heatmap grid + a small recharts line for the pain
  trend (avg severity per day).
- **Profile**: `api.users.getUser` + `api.healthProfiles.getHealthProfileByUserId`;
  `chronicConditions` as plain list rows (no badge); `medications` as a plain
  list; Days Tracked/Insights stats computed from real log/insight counts (no
  Accuracy stat, no Premium badge).
- **Doctor Dashboard**: `api.users.getUser` (name only), `api.aiInsights.getAiInsightsByUserId`
  filtered to Verified/Confirmed → "Observed Patterns" cards; stats row shows
  real counts only (Confirmed Patterns, Total Logs, Avg Confidence) — no Risk
  Level, no DoB.
- **AI Architecture**: static pipeline UI with 3 steps — "Claude Sonnet 5 —
  Insight Agent", "Claude Sonnet 5 — Verifier Agent (independent review)",
  "Convex Database" — no backend calls.

## Implementation Checklist
- [ ] Add `convex` dependency; create `src/lib/convex-client.ts` with hardcoded URL + `api = anyApi`
- [ ] Wrap app in `ConvexProvider` (`main.tsx`) and `SessionProvider` (`App.tsx`)
- [ ] Define `src/types/health.ts` interfaces for all 7 backend data shapes
- [ ] Build `session-context.tsx` + `require-session.tsx` with localStorage persistence
- [ ] Add violet primary + pain/energy/mood/sleep/success/warning tokens to `index.css` and `tailwind.config.ts`
- [ ] Build shared `app-shell`, `bottom-nav`, `page-header` layout components
- [ ] Auth screen: sign-in-by-email + inline create-account fallback, session set on success
- [ ] Onboarding screen: static 3-slide carousel, Continue → Home
- [ ] Home screen: cycle badge + 4 overview cards + Log Symptoms CTA, empty state when no logs
- [ ] Log Symptoms screen: chip multi-select, shared severity slider, mood/energy/sleep/notes, submit → createSymptomLog → Processing
- [ ] Processing screen: fires `runDualAgentAnalysis` action, 4-step animated checklist, navigates to Insights on completion
- [ ] Insights screen: card list with status badge, confidence bar, evidence count, expandable agent debate summary, link to Architecture
- [ ] Timeline screen: month-grouped entries from `getSymptomTimeline`, disclaimer banner, factual "N months tracked" summary (no fabricated verified/contradicted counts)
- [ ] History screen: heatmap grid aggregated from monthly logs + pain trend line chart
- [ ] Profile screen: user info, conditions list (no badge), medications list, real Days Tracked/Insights stats only
- [ ] Doctor Dashboard screen: name-only header, real stat counts (no Risk Level/DoB), Verified/Confirmed pattern cards, link to Timeline
- [ ] AI Architecture screen: 3-step accurate pipeline diagram, entry link from Insights
- [ ] Register all routes in `router.tsx`, protected ones wrapped in `RequireSession`

## Verification Checklist
- [ ] App loads at `/`, shows Auth screen matching screenshot styling (gradient hero, Sign In/Create Account tabs, 3 provider buttons)
- [ ] Signing in with the seed userId's email (or creating a new user) correctly sets session and routes to Onboarding (new user) or Home (existing user)
- [ ] Refreshing the browser preserves the logged-in session (localStorage)
- [ ] Visiting a protected route (e.g. `/home`) with no session redirects to `/`
- [ ] Home overview cards render real values from `listSymptomLogs`/`getCycleDayAndPhase`, and a sensible empty state when there are no logs
- [ ] Logging symptoms creates a record (verify via Home overview updating) and always proceeds to Processing → Insights
- [ ] Processing screen calls `runDualAgentAnalysis` via `useAction` (not a mutation) and only navigates onward after it resolves
- [ ] Insights list reflects `getAiInsightsByUserId` data, including a new insight after a fresh log/analysis cycle
- [ ] Profile and Doctor Dashboard never render Premium/Accuracy/Active-badge/Risk-Level/DoB — confirmed absent from rendered output
- [ ] Timeline, History, Architecture screens render without runtime errors and visually match the design language of the other screens
- [ ] `pnpm lint` and the project build both pass with no errors
