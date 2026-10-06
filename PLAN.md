# PLAN.md — Ascent

Implementation plan for rebuilding the supplied design (`../Design/Ascent/*.dc.html`) as a Nuxt 4 + Supabase application deployed on Vercel.

**Sources of truth, in priority order:**
1. The design files.
2. The implementation as it grows.
3. The product brief.
4. Our own decisions, used last.

This plan describes direction. Each phase is a separate, reviewable task. We do not build ahead of the current phase.

---

## 0. Current state

- **Repo:** `Ascent/` is an empty git repository on `main`. There is no existing code, so there is nothing to reuse or replace.
- **Design:** `Design/Ascent/` holds 8 pages in a custom "dc" format: HTML with inline styles, `{{ }}` bindings, `<sc-if>`/`<sc-for>` and a JS logic class. `support.js` is only the runtime for that format and is ignored.

| File | Status | Contains |
|---|---|---|
| `Today.dc.html` | **Current** | Today dashboard: mood logging, today's chart, recent moments. **Also the Journey detail view** (`#journey`): vertical "climb" column, next floor, mood chart, notes, why. |
| `Timeline.dc.html` | Current | Period explorer (Day/Week/30 days/Year/All time), stats strip, line chart / year heatmap, journey lanes, best/lowest moments, patterns. |
| `Journal.dc.html` | Current | Day-grouped feed of notes, composer for longer entries, search/mood/tag filters, "On this day", journey events. |
| `Journeys.dc.html` | Current | Journey list (climbing now, attempts, behind you), 4-step creation wizard, "begun" confirmation. |
| `Insights.dc.html` | Current | Worth noticing, time of day, tag context, before/during journeys. |
| `Year Review.dc.html` | Current | Editorial "Wrapped"-style year page. |
| `Auth.dc.html` | Current | Split-pane login/signup/forgot, plus first-mood onboarding. |
| `Today v1 (tower).dc.html` | **Superseded** | Older Today with a pseudo-3D window tower. **We will not implement it.** Its vocabulary survives in the current design: floors, roman numerals, "Summit", checkpoints `[1,3,7,14,30,60,90]`, expectation copy. The current tower metaphor is the vertical sage "steps" column in Today's journey view. |

The design is desktop-first. It switches to a mobile layout below **760px** (JS `innerWidth < 760`); we will reproduce this with CSS media queries so it renders correctly under SSR.

---

## 1. Understanding of the visual system

### 1.1 Character
- **Mood:** quiet, dark and editorial, with near-black warm surfaces, warm off-white text and very low-contrast hairlines (white at 4–8% alpha).
- **Shapes:** no shadows except on tooltips and glows, no heavy cards and no icons-as-decoration. Hierarchy comes from typography, grey steps and hairline dividers.
- **Accents:**
  - **Amber**, `oklch(0.83 0.1 72)`: the brand dot, link hover, milestone diamonds and selection.
  - **Sage green**, `rgb(150,170,116)`: everything related to Journeys and progress.
  - **Mood scale:** five OKLCH colors running from blue (Sad) to warm gold (Great).
- **Data visualization:** smooth Catmull-Rom curves stroked with a vertical mood gradient, dashed average lines, faint bands, and HTML-overlay dots with a dark "halo" border. Charts carry honest disclaimers such as "a pattern, not a proven cause".

### 1.2 Typography (four families)
| Family | Role | Typical use |
|---|---|---|
| **Geist** 300/400/500/600 | UI text | Body 14px/1.45. Today H1 34px/400, −0.025em. Light (300) numbers at 22–44px. |
| **Geist Mono** 400/500 | Labels, times, scores, keycaps | Section eyebrows 10.5–11.5px, uppercase, 0.08em. Times 12–12.5px. |
| **Inria Serif** 300/400/700 | Page titles and editorial headings | H1 34px/700 −0.01em. H2 22–30px/400. Journey names and "Day N" in 700. Year hero is weight 300 at `clamp(96px,16vw,180px)`. |
| **Newsreader** roman and italic 300/400 | The user's own words | "Why" quotes (italic 22–24px), wizard textareas (roman 21px / italic 22px), journal long entries (19–20px), Year reflection (300 at 25px). |

### 1.3 Color tokens (extracted)
- **Surfaces:**
  - `#0B0B0C` page, also the dot halo
  - `#09090A` sidebar and auth panel
  - `#111113` card, input and segmented track
  - `#141416` mood tile and future node
  - `#18181B` tile hover
  - `#17171A` tooltip
  - `#1E1D1B` avatar
  - `#3A3937` disabled
- **Text greys (brightest to dimmest):** `#ECEAE5`, `#E4E1DA` (quotes), `#D9D6CF`, `#C9C7C2`, `#9A9893`, `#8F8D88`, `#7C7A75`, `#737373`, `#6E6C68`, `#64625E`, `#5E5C58`, `#55534F`, `#4E4C49`, `#4A4946`.
- **Hairlines:** white at .015 / .025 / .03 / .04 / .05 / .06 / .07 / .08 / .09 / .1 / .12 / .14 / .18 / .2 / .22 / .25.
  - The journey detail additionally uses `rgba(59,59,59,.4/.5/.6)`.
- **Warm overlays:** `rgba(236,234,229, .05 / .08 / .1 / .25 / .32 / .35 / .4)`.
- **Moods:**

| Mood | Color |
|---|---|
| Sad | `oklch(.58 .075 262)` |
| Low | `oklch(.64 .06 232)` |
| Neutral | `oklch(.72 .018 85)` |
| Good | `oklch(.77 .085 78)` |
| Great | `oklch(.83 .105 68)` |

- **Continuous mood color `mc(v)`:** used for averages, heatmap cells and month bars. It interpolates in OKLCH between these anchors (note they are darker than the mood colors above):

| v | L | C | H |
|---|---|---|---|
| 2 | .50 | .075 | 262 |
| 4 | .58 | .06 | 232 |
| 5.5 | .66 | .018 | 85 |
| 7.5 | .74 | .085 | 78 |
| 9 | .82 | .105 | 68 |

- **Sage:** `rgb(150,170,116)`.
  - Lighter variants: `rgb(168,188,134)` (orb highlight), `rgb(160,182,124)` (labels), `rgb(170,190,140)` (text), `#B6C59C` (chips).
  - Alpha steps: .1, .25, .35, .5, .6.
- **Semantic deltas:**
  - Positive: `oklch(.8 .085 78)`, with `.82` for callouts.
  - Negative: `oklch(.7 .05 232)`, with `.66 .05 232` and `.72 .05 232` variants.
- **Error (hue 30):** `oklch(.66 .08 30 / .7)` border, `oklch(.72 .08 30)` field text, `oklch(.75 .07 30)` form error.

### 1.4 Shape, spacing, motion
- **Radii:** 1–2 (bars), 4 (keycap), 5 (score button), 6 (buttons, nav items), 7 (auth inputs and buttons), 8 (segmented, tiles, tooltip), 10 (cards), 13 (pill chips), 50%.
- **Control heights:** 26 (chip, small segmented), 28 (segmented, small button), 30, 32, 34 (primary in headers), 36, 38, 40, 42 (OAuth), 44 (auth input and primary).
- **Layout:**
  - Sidebar is 232px wide, sticky and 100vh tall.
  - Main padding is `30px 44px 72px` on desktop and `18px 16px 108px` on mobile, where the bottom pad leaves room for the fixed bottom nav.
  - Content max-widths per page: Today 920, Journeys list 900, wizard 760, Journal 860, Insights 880, Year 960, Timeline 1180, Journey detail 1240, Auth form 380.
- **Motion:** small and functional.
  - 0.08–0.3s on hover and selection.
  - Keyframes:
    - `bl-ring`: mood tile pulse
    - `bl-dot`: new chart point
    - `bl-in`: log panel reveal
    - `bl-breathe` / `au-breathe`: orb glow
  - The journey progress tube animates its height over 1.2s, and the steps transition over 1s.
  - Nothing else animates.

### 1.5 Navigation and shell
- **Desktop sidebar**, from top to bottom:
  - Brand mark: a dot on a baseline, drawn in CSS, with the wordmark "baseline".
  - Primary nav: Today, Timeline, Journeys, Insights, Journal, Year review. Each item shows its mono shortcut letter (T, L, J, I, E, R).
  - "ACTIVE JOURNEYS" list: colored dot, name and `D12`.
  - Spacer.
  - Settings (`,`), user block (avatar initials, name, "Since Mar 2024"), Sign out (`⇧Q`).
- **Mobile top bar:** brand on the left; "Year review" link and a Sign-out pill on the right.
- **Mobile bottom nav:** fixed, blurred, 5 tabs (Today, Timeline, Journeys, Insights, Journal), each with a small CSS-drawn glyph.
- **Active nav item:** background `rgba(255,255,255,.05)`, text `#ECEAE5`, weight 500.
- **Keyboard-first:** the design advertises many shortcuts.
  - Global: `1`–`5` log a mood, `N` adds a note, `Esc` finishes.
  - Today: `T`/`J`, `⌘K` search.
  - Timeline: `D/W/M/Y/A` change the range, `←/→` move between periods.
  - Journal: `W` opens the composer.
  - Journeys: `N` starts a new journey.

---

## 2. Reusable patterns found in the design

These patterns appear on more than one page, so each becomes **one** component or style.

| Pattern | Where | Becomes |
|---|---|---|
| Page header: mono eyebrow, serif H1 34px, optional 14px description, right-side actions | Timeline, Journal, Journeys, Insights (Today has a Geist variant) | `PageHeader` |
| Section label (mono, uppercase, 0.08em; 10.5px `#6E6C68` or 11px `#7C7A75`) | Everywhere | `.section-label` class plus a `SectionLabel` component with a `size` prop |
| Section header: label, serif H2 (22/26/28/30px), description | Insights, Year, Journey detail, Wizard | `SectionHeader` |
| Card (`#111113`, 1px .07, radius 10) | Today log card, On this day, composer, tag detail | `BaseCard` |
| Segmented control (track `#111113`, padding 3, radius 8; items radius 6, selected bg .08). Variants: mono uppercase with keycap, or sans 12.5px | Timeline, Journal, Insights, Year, Wizard length | `SegmentedControl` |
| Buttons: primary light (`#ECEAE5` on `#0B0B0C`), outline, ghost/text, sage CTA, icon 30×30, optional inline keycap | Everywhere | `BaseButton` (variant, size, `kbd` prop) |
| Keycap hint (mono letter in a hairline box, or inline with opacity .55) | Sidebar, Today, buttons, segmented | `KeyHint` |
| Pill chip (h26, radius 13, selected border/bg warm alpha) | Today context tags, Journal filters | `ChipButton` |
| Mood dot plus "Label N/10" | Today, Timeline, Journal, Year, tooltips | `MoodDot`, `MoodBadge` |
| Chart tooltip (`#17171A`, radius 8, shadow, 240–260px) | Today, Timeline, Year | `ChartTooltip` |
| Diamond marker: hollow (observation), filled (journal event), rotated square | Today, Timeline, Insights, Journal | `Diamond` |
| Observation row: diamond, sentence, "pattern, not a proven cause" caption | Today, Timeline patterns, Insights notices | `ObservationItem` (with an optional `EvidenceMeter`) |
| Moment / quote row: mono time, mood dot and score, quoted note, tags | Today recent moments, Timeline best/lowest, Insights tag notes, Journey notes, Year moments | `MomentRow` (layout variants) |
| Smooth mood line chart: SVG viewBox with `preserveAspectRatio=none`, vertical mood gradient, gridlines, dashed average, optional band/area, HTML overlay points, Y/X label rows | Today, Timeline, Insights hour chart, Year arc, Journey daily chart | `MoodLineChart` base with slots (overlays, markers, tooltip) |
| Journey lane bar (active sage gradient, completed warm .32–.4, stopped white .14–.18) | Timeline, Year | `JourneyLane` |
| Mini mood bars (one bar per entry or day) | Journal day rail, Year month cards | `MiniMoodBars` |
| Stat block (big light number plus small label) | Today, Timeline strip, Insights, Year hero, Journey phases | `StatBlock` |
| Hairline list / table rows (header mono 10.5 .06em `#55534F`) | Insights, Journeys, Year | SCSS `%list-row` pattern |
| Breadcrumb (`Parent / Child`) | Journey detail, Wizard | `Breadcrumb` |
| Sage orb (radial gradient circle with glow) | Auth panel, Journey detail steps, "Begun" view | `JourneyOrb` |
| Disclaimer footnote (12–12.5px `#55534F`) | Insights, Year, Timeline, Wizard | `.footnote` class |

---

## 3. Tech setup

### 3.1 Stack
- **Nuxt 4** (`app/` directory), Vue 3, TypeScript (strict), `<script setup lang="ts">`.
- **SCSS** via `sass` (Dart Sass, `@use`/`@forward`). **No Tailwind, no UI framework.**
- **`@nuxtjs/supabase`**: auth, `useSupabaseClient`, `useSupabaseUser` and route protection.
- **`@nuxt/fonts`**: self-hosts Geist, Geist Mono, Inria Serif and Newsreader (no runtime Google request). It works on Vercel.
- **Font Awesome:** `@fortawesome/fontawesome-svg-core`, `@fortawesome/vue-fontawesome` and the free subsets `@fortawesome/free-solid-svg-icons` / `free-regular-svg-icons` (see §3.4).
- **Dev tooling:** `@nuxt/eslint` and Vitest. Vitest covers the pure analytics and date utilities, which hold most of the logic risk.
- **Vercel:** default Nuxt preset (Nitro auto-detects Vercel). No extra infrastructure.

### 3.2 Folder structure
```
app/
├── app.vue
├── assets/scss/                 # see §4
├── layouts/
│   ├── default.vue              # shell: sidebar / mobile top bar / bottom nav
│   └── auth.vue                 # split pane: brand panel + form column
├── pages/
│   ├── index.vue                # Today
│   ├── timeline.vue
│   ├── journal.vue
│   ├── insights.vue
│   ├── review/[[year]].vue      # Year review
│   ├── journeys/
│   │   ├── index.vue            # list
│   │   ├── new.vue              # wizard (+ begun state)
│   │   └── [id].vue             # detail (Today.dc.html #journey view)
│   ├── login.vue  signup.vue  forgot-password.vue  reset-password.vue
│   └── welcome.vue              # first mood after signup
├── components/                  # see §5
├── composables/                 # useMoodEntries, useJourneys, useHotkeys, useNow, …
├── utils/                       # mood.ts, chart.ts (smooth, scales), date.ts, analytics/*.ts
├── types/                       # domain types (MoodEntry, Journey, …) + generated database.types.ts
├── plugins/fontawesome.ts
└── middleware/                  # (only if @nuxtjs/supabase redirect options are not enough)
server/                          # later: AI endpoints (server-only keys)
supabase/
├── migrations/                  # SQL migrations, one per feature
└── seed.sql                     # realistic dev data (ported from the design's seeded generator)
```

### 3.3 Separation of concerns
| Layer | Location | What it holds |
|---|---|---|
| UI | components and pages | Pages compose components and coordinate page-level data. No raw Supabase calls in components. |
| Data access | composables (`useMoodEntries`, `useJourneys`, `useJournal`) | Wrap Supabase queries and mutations and return typed, reactive data. |
| Domain logic | `app/utils/analytics/*` | Pure functions: stats, best/lowest, time-of-day, tag deltas, notices, year superlatives. They are ported from the design's JS, unit-tested, and have no Vue or Supabase imports. |
| Types | `app/types/` | Shared types. DB row types are generated with `supabase gen types`. |
| Constants | `app/utils/mood.ts`, `app/utils/journey.ts` | `MOODS`, default tags, checkpoint days, roman labels, expectation copy. |

### 3.4 Font Awesome strategy
- **Plugin:** `app/plugins/fontawesome.ts` registers `FontAwesomeIcon` globally as `<FaIcon>`. Icons are added to the library through **one file**, `app/utils/icons.ts`, which maps our semantic names to FA definitions:
  ```ts
  // icons.ts — the only place that imports from @fortawesome/*-svg-icons
  export const icons = { search: faMagnifyingGlass, close: faXmark, check: faCheck, arrowLeft: faArrowLeft, … }
  ```
- **`AppIcon` component:** takes `name: keyof typeof icons`. Switching to Pro later means changing the imports in `icons.ts`; nothing else changes.
- **Pro later:**
  - An `.npmrc` entry `@fortawesome:registry=https://npm.fontawesome.com/` with `//npm.fontawesome.com/:_authToken=${FONT_AWESOME_TOKEN}`, where the token is an env var. Locally it lives in user-level config; on Vercel it is a project env var.
  - We add this `.npmrc` only when Pro is enabled. **No token is ever committed.**
- **Design fidelity rule:** the design deliberately draws some glyphs in CSS. Those are brand and data-visualization marks, not interface icons, so they stay CSS:
  - the brand mark
  - mood dots
  - diamonds
  - the 5 bottom-nav glyphs
  - the Journal search circle
  - the "→ / ← / × / ✓" text glyphs

  Font Awesome is used where the design implies a functional icon with no drawn precedent: search, close, settings, show/hide, chevrons in new UI, and states that are not designed yet. *(See open question Q3.)*

### 3.5 Environment
- **`.env.example`** (committed, no values):
  - `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY` (anon / publishable)
  - Later: `ANTHROPIC_API_KEY` (server only)
  - `FONT_AWESOME_TOKEN`, used only by npm at install time (shell / Vercel env, not `.env`)
- **Service-role key:** never used in the browser. If a server route ever needs it, it lives in a server-only `runtimeConfig` key.

---

## 4. SCSS architecture

Entry: `app/assets/scss/_style.scss`, registered once in `nuxt.config.ts` as `css: ['~/assets/scss/_style.scss']`.

**Day one (only what we need):**
```
assets/scss/
├── _style.scss          # entry: @use every partial below, in order
├── abstracts/
│   ├── _index.scss      # @forward tokens + breakpoints + mixins (outputs NO CSS)
│   ├── _tokens.scss     # SCSS maps/vars: colors, mood, type, radii, sizes, z, durations
│   ├── _breakpoints.scss# $breakpoints map + @include respond-to(mobile | desktop | reduced-motion)
│   └── _mixins.scss     # mono-label, hairline, focus-ring, visually-hidden, …
├── base/
│   ├── _root.scss       # emits CSS custom properties from tokens (needed for runtime/inline use)
│   ├── _reset.scss      # body, a, ::selection, placeholder, autofill, button reset
│   ├── _typography.scss # font stacks, .t-mono, .t-serif, .t-quote, heading classes
│   └── _animations.scss # bl-ring, bl-dot, bl-in, bl-breathe
├── layout/
│   └── _shell.scss      # sidebar, main padding, mobile top bar, bottom nav
└── components/
    └── _buttons.scss  _forms.scss  _segmented.scss  _card.scss  _chip.scss  …
```

**Later, as pages land:** add `components/_chart.scss`, `_tooltip.scss`, `_mood.scss`, `_journey.scss`, `_journal.scss`, `_insights.scss`, `_review.scss`, `_auth.scss` and `pages/*` partials, only when a page actually needs them.

**Rules:**
- **Tokens in SCSS:** the abstracts are injected into any component `<style lang="scss">` through `vite.css.preprocessorOptions.scss.additionalData` (`@use "~/assets/scss/abstracts" as *;`). This makes tokens available without duplicating CSS. It should rarely be needed, because component styles default to the central partials.
- **CSS custom properties** (from `_root.scss`) cover values that must be bound at runtime: the mood color of an entry, chart positions, progress percentages.
- **Inline styles** are allowed **only** for data-driven custom properties and geometry, for example `:style="{ '--mood': color, left: x + '%' }"`. Everything static lives in SCSS.
- **Class naming:** BEM-style (`.mood-picker__tile.is-selected`), scoped by component root class. No utility-class framework.
- **Breakpoints:** never write a raw `@media` query. Use `@include respond-to(mobile) { … }` (`< 760px`, matching the design), `respond-to(desktop)` (`≥ 760px`) or `respond-to(reduced-motion)`. New ranges are added only to the `$breakpoints` map in `abstracts/_breakpoints.scss`; an unknown name fails the build. Mood colors, the `mc()` anchors and the sage/amber accents are exposed as both SCSS tokens and CSS vars. `mc()` itself is computed in TS (`utils/mood.ts`) because it is data-driven.
- **Values:** the design uses many exact pixel values. Tokens capture the repeated ones (colors, radii, control heights, type sizes, gaps that recur). We do **not** round one-off values onto an invented scale if that would change the design.

---

## 5. Component map

The tree below is a starting point and will be extended per phase.

```
components/
├── app/        AppShell parts
│   AppBrand.vue            # dot-on-baseline mark + wordmark (also used on auth)
│   AppSidebar.vue          # nav, active journeys, settings/user/sign out
│   AppNavItem.vue          # label + KeyHint, active state
│   AppUserBlock.vue
│   AppMobileTopBar.vue
│   AppMobileNav.vue        # 5 tabs with CSS glyphs
│   AppIcon.vue             # FA wrapper (semantic names)
├── ui/         generic, product-agnostic
│   BaseButton.vue  KeyHint.vue  SegmentedControl.vue  BaseCard.vue  ChipButton.vue
│   PageHeader.vue  SectionHeader.vue  SectionLabel.vue  Breadcrumb.vue  Stepper.vue
│   StatBlock.vue  Diamond.vue  EvidenceMeter.vue  CheckSquare.vue
│   TextField.vue  PasswordField.vue  BaseTextarea.vue
├── mood/
│   MoodPicker.vue          # 5 tiles; sizes: large (Today), compact (mobile/onboarding)
│   MoodLogPanel.vue        # logged-at row, Undo/Done, Intensity, Context tags, Note
│   IntensityScale.vue      # 1–10
│   TagPicker.vue
│   MoodDot.vue  MoodBadge.vue
│   MomentRow.vue           # time · mood · note · tags (layout variants)
│   ObservationItem.vue
│   MiniMoodBars.vue
├── charts/
│   MoodLineChart.vue       # base: svg, gradient, grid, avg line, band/area, points overlay, axes, slots
│   ChartTooltip.vue
│   DayMoodChart.vue        # Today: yesterday dashed, NOW marker, future shade, cravings lane
│   YearHeatmap.vue         # Timeline year view
│   WeekdayBars.vue  DivergingBarRow.vue  DumbbellRow.vue  YearArcChart.vue  MonthMiniCard.vue
├── timeline/   TimelineStats.vue  JourneyLanes.vue (+ JourneyLane.vue shared w/ Year)  MomentsColumn.vue  PatternList.vue
├── journal/    JournalComposer.vue  JournalFilters.vue  OnThisDay.vue  JournalDay.vue
│               JournalCheckIn.vue  JournalLongEntry.vue  JournalEvent.vue  JournalMonthHeader.vue
├── journey/    JourneyListItem.vue  CheckpointTrack.vue (horizontal, log-scale)  AttemptBars.vue  PastJourneyRow.vue
│               JourneyClimb.vue (vertical steps + progress tube: the "tower")  JourneyOrb.vue
│               JourneyNextFloor.vue  JourneyMoodChart.vue  JourneyNotes.vue  JourneyWhy.vue
│               wizard/ WizardWhat.vue  WizardWhy.vue  WizardRules.vue (RuleColumn.vue)  WizardFloors.vue  JourneyBegun.vue
├── insights/   NoticeList.vue  HourChart.vue  TagContextTable.vue  TagDetailCard.vue  JourneyComparison.vue
├── review/     ReviewHero.vue  Superlatives.vue  MonthGrid.vue  ReviewMoments.vue  TagFrequency.vue  ReviewJourneys.vue  Reflection.vue
└── auth/       AuthBrandPanel.vue  OAuthButtons.vue  PasswordStrength.vue  FirstMood.vue (reuses MoodPicker)
```

**Composables:**
- **Data:** `useMoodEntries`, `useTags`, `useJournal`, `useJourneys`, `useProfile`.
- **App:** `useHotkeys` (global and page shortcuts, ignored in inputs and with modifiers), `useNow` (a ticking clock, as the design re-renders every 20s), `useActiveJourneys` (sidebar).

Analytics stay in pure utils and are called from pages or computed properties. We add a `useX` wrapper only if that logic is reused.

**State:** no global store. Data lives in composables built on `useAsyncData`/`useState` where it needs sharing (current user, active journeys).

---

## 6. Data model and Supabase (built incrementally)

**Every table:**
- has `user_id uuid not null default auth.uid() references auth.users on delete cascade`;
- has RLS enabled;
- has policies `using (user_id = auth.uid()) with check (user_id = auth.uid())` for select, insert, update and delete.

Child tables carry `user_id` too, which keeps policies simple and fast. Schema changes go in `supabase/migrations/*.sql`, and types are regenerated after each one.

| Migration (phase) | Tables | Notes |
|---|---|---|
| 1. Profiles (Phase 3) | `profiles(id pk → auth.users, display_name, timezone, created_at)` | Created on signup by a trigger. `timezone` drives day grouping. |
| 2. Mood (Phase 3) | `mood_entries(id, user_id, logged_at timestamptz, level smallint 1–5, score smallint 1–10, note text, tags text[], created_at, updated_at)` | `level` is what the user tapped; `score` is the 1–10 intensity (defaults Sad 2, Low 4, Neutral 5, Good 7, Great 9, as in the design). **Tags are a `text[]` on the entry** rather than tag tables: every check-in stays a single atomic write, and analytics use `unnest()`. A per-user `tags` table can be added once tag management is designed. Indexes: `(user_id, logged_at desc)` and GIN on `tags`. |
| 3. Journal (Phase 5) | `journal_entries(id, user_id, written_at, body)` | The design's "longer entries". Notes on check-ins stay on `mood_entries`. |
| 4. Journeys (Phase 6) | `journeys(id, user_id, name, what_text, why_text, why_written_at, length_days, checkpoint_days int[], color, status, created_at)`; `journey_rules(id, journey_id, user_id, kind 'remove'\|'allow', label, suggested bool, position)`; `journey_attempts(id, journey_id, user_id, number, started_at, ended_at, end_reason 'setback'\|'paused'\|'completed'\|null)`; `journey_setbacks(id, attempt_id, user_id, occurred_at, note, outcome 'continued'\|'restarted')` | "A setback is recorded, not reset." **Continue** keeps the attempt running and logs a setback. **Restart** ends the attempt and opens attempt N+1. Previous attempts are always kept. |
| Later | `ai_insights` cache, if AI summaries are added | Only when the AI phase starts. |

**Not stored:** derived values (daily averages, current day, floor progress, stats). They are computed from entries, initially in TS. If volume demands it later, we add SQL views or RPCs (for example `daily_mood(user, from, to)`).

**Dev seed:** `supabase/seed.sql` (or a TS script) ports the design's seeded generator (mulberry32, seed 7: data from 2024-03-04 to "today", journeys, notes). Every page can then be checked against the design with realistic history.

---

## 7. Implementation phases

Each phase ends with the same verification: **side-by-side comparison with the design file in the browser at 1440px and 375px**, keyboard shortcuts checked, `nuxi typecheck` and lint clean.

### Phase 0: Scaffold ✅
- [x] Nuxt 4 (`app/` dir) with strict TS, `@nuxt/eslint` (stylistic) and Vitest (`npm run lint | typecheck | test`).
  - **Nuxt is pinned to `4.5.2`.** 4.6.0 fails every SSR request with "Either manifest or precomputed data must be provided"; a clean, untouched scaffold fails the same way. Re-test before upgrading.
- [x] `sass` with tokens/breakpoints/mixins injected through `additionalData`, and the `_style.scss` entry.
- [x] `@nuxt/fonts` self-hosts the four families with the exact weights and styles the design loads (Newsreader upright 300 included, see §8 #6).
- [x] Font Awesome: `utils/icons.ts` (the only FA import site), `AppIcon` and a plugin. The committed `.npmrc` holds the Pro registry config; the token comes from the `FONT_AWESOME_TOKEN` environment variable (Windows user env locally, Vercel project env in deploys).
- [x] `.env.example` (`NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`). `.env*` is gitignored.
- [x] `@nuxtjs/supabase` is installed. It registers itself only when those env vars exist, with redirect off; until then the app runs without it.
- [x] `nuxt build` succeeds. Locally it uses the `node-server` preset; on Vercel, Nitro switches to the Vercel preset automatically.

### Phase 1: Design foundation and shell ✅
- [x] `abstracts/_tokens.scss` (surfaces, the full text-grey scale, hairlines, accents, moods, type, radii, layout, motion), plus `base/_root.scss` (runtime CSS vars such as `--mood-1…5`), `_reset.scss`, `_typography.scss` and `_animations.scss`.
- [x] `utils/mood.ts` (`MOODS`, `DEFAULT_TAGS`, `getMood`, `levelFromScore`, `moodColorContinuous`) and `utils/chart.ts` (`smoothPath`), both unit-tested.
- [x] `layouts/default.vue` with `AppSidebar`, `AppMobileTopBar`, `AppMobileNav`, `AppBrand`, `AppAvatar` and `AppNavItem`. Active state comes from the route (`utils/navigation.ts`).
  - On a journey detail page, the journey row in the sidebar is highlighted instead of "Journeys", as in the design. The mobile Journeys tab stays active.
- [x] UI primitives in `components/ui/`, registered without the folder prefix: `BaseButton`, `KeyHint`, `SegmentedControl`, `BaseCard`, `ChipButton`, `PageHeader`, `SectionLabel`, `SectionHeader`, `Diamond`. `MoodDot` lives in `components/mood/`.
- [x] Route stubs for every page: `/`, `/timeline`, `/journal`, `/journeys`, `/journeys/new`, `/journeys/[id]` (404 for unknown ids), `/insights`, `/review/[[year]]`, `/settings`, and a temporary `/login`.
- [x] `useHotkeys`:
  - Global shortcuts are T/L/J/I/E/R and `,`, plus `⇧Q` (goes to `/login` until phase 3). Page shortcuts are `N` on Journeys and `Esc` on the wizard.
  - Shortcuts are ignored while typing and while Ctrl, Cmd or Alt is held.
- [x] Shell data (profile, active journeys) comes from typed fixtures in `app/fixtures/shell.ts`, through `useProfile` and `useActiveJourneys`.
- **Verified** against the design running locally, at 1280px and 375px:
  - Sidebar, page header, primary button, segmented control, mobile top bar and tab bar all match the measured positions and sizes to within 0.5px.
- **Design note: box-sizing.** The design files set no `box-sizing`. `<a>` elements and text inputs with a declared height and a border are therefore 2px taller than declared; `<button>`s are not (browsers default them to border-box). We use border-box globally, so those cases declare the rendered height. Example: the mobile sign-out pill is 30px.

### Phase 2: Today ✅
- [x] **Logging:** `MoodLogCard` holds `MoodPicker` (pulse ring on pick) and `MoodLogPanel`, which contains `IntensityScale`, `TagPicker` and the note.
  - Logging flow (`useMoodLog`): pick a mood (tap or `1`–`5`) to create an entry stamped "now". Picking again while it's open changes that same entry.
  - Undo deletes the entry. Done, `Esc` or `Enter` in the note closes the panel. `N` focuses the note, logging Neutral first if nothing is open.
- [x] **Chart:** `DayMoodChart` has the mood-gradient line, area fill, gridlines, dashed yesterday line (toggle), NOW marker with the future shaded, and the fresh-point ring.
  - Points are focusable buttons that show `ChartTooltip`.
  - The cravings lane is a generic `ChartLane` (tag, label); Today passes the nicotine lane as a constant until phase 6.
- [x] **Page:** `TodayHeader` (dayline, greeting, last check-in, "Search entries ⌘K", which opens `/journal` per Q5), `TodayMood` (average, range, check-ins, 30-day average, `ObservationItem`) and `RecentMoments` (`MomentRow`).
- [x] **Data:** `useMoodEntries` (async add/update/remove, applied immediately in memory) runs on `fixtures/mood.ts`, built relative to the real "today". The `MoodEntry` type matches the planned table.
  - The observation text is a fixture until phase 8.
- [x] **Time:** `useTimezone` reads a `tz` cookie, so the server renders in the user's zone. `plugins/timezone.client.ts` sets the cookie and reloads once on first visit.
  - `utils/date.ts` handles zoned day keys, minutes, DST and formatting, with tests. `useNow` ticks every 20 s.
- [x] **Small additions:**
  - `useHotkeys` supports `mod+` bindings (⌘K / Ctrl+K).
  - Components are registered without folder prefixes, so names must be unique.
  - `utils/chart.ts` gained `scoreToY` and `dayAxisPosition`.
- **Verified** against the running design at 1280px and 375px.
  - Header, card, tiles, open panel (intensity, chips, note), chart box, axes, lane, observation and moment rows match to within 0.5px.
  - All interactions were exercised: keys, Undo, Done, Esc, Enter, note and tooltip. There are no hydration warnings.
- **Deferred:**
  - A generic `MoodLineChart` base will be extracted in phase 4, once Timeline gives a second real use. Today's chart already uses the shared `smoothPath` and `scoreToY` helpers and the shared tooltip.
  - Note edits should be debounced when Supabase lands.

### Phase 3: Supabase, auth and real mood data ✅
- [x] **Database** (Supabase project "Ascent", eu-central-1). Migrations live in `supabase/migrations/` and are applied to the project.
  - `profiles` is created by a trigger from signup metadata. It holds the display name, falling back to the OAuth name and then the email prefix, and a timezone validated against `pg_timezone_names`, falling back to UTC.
  - `mood_entries` is described in §6.
  - RLS is on for both tables, with owner-only policies using `(select auth.uid())`.
  - A rolled-back two-user test confirmed:
    - each user sees, updates and deletes only their own rows
    - inserting a row as another user is blocked
    - invalid values are rejected
    - anonymous requests get nothing
  - The security advisor reports nothing. Types are generated into `app/types/database.types.ts`.
- [x] **Auth layout:** `layouts/auth.vue` and `AuthBrandPanel` (the sage climb with a breathing glow and top fade). The top-right switch link comes from `definePageMeta({ authSwitch })`.
- [x] **Auth pages:**
  - Built from the design: `/login`, `/signup` (strength meter), `/forgot-password` ("Check your inbox") and `/welcome` (first mood, using the compact `MoodPicker`).
  - Extrapolated: `/reset-password`, `/confirm` (callback for email and OAuth links), and signup's "check your inbox" step for projects that require email confirmation.
  - Shared form components: `TextField`, `PasswordField`, `PasswordStrength`, `AuthIntro` and `OAuthButtons`.
  - Login and signup match the running design to within 0.5px at 1280px and 375px.
- [x] **Auth behaviour:**
  - `useAuth` handles email and password sign-in and sign-up, password reset, and Google OAuth (needs the provider enabled in the dashboard). The design's "Continue with Apple" button was removed by decision: Apple needs a paid developer account and a client secret that has to be regenerated every 6 months.
  - Supabase errors are translated into the product's own wording.
  - Post-login redirect paths are checked to be in-app paths.
  - The global middleware redirects to `/login`, and the `guest` middleware sends signed-in users away from the auth pages.
  - Sign out (sidebar, mobile pill, `⇧Q`) reloads the app so no previous user's data stays in memory.
- [x] **Mood data on Supabase** (`useMoodEntries`):
  - Today loads the last 31 days on the server.
  - Inserts, updates and deletes are optimistic and queued per entry, so an update can't reach the database before its insert.
  - Failed writes roll back and show a dismissible error on the log card.
  - Notes save after 600 ms of quiet; Done saves immediately.
  - Mood fixtures are removed. The observation text (until phase 8) and active journeys (until phase 6) are still fixtures.
- [x] **Profile:** `useProfile` loads it in the default layout. The stored timezone is kept in step with the browser's.
- [x] **Font Awesome:** switched to Pro Light (`@fortawesome/pro-light-svg-icons`). The free packages are removed; `utils/icons.ts` is still the only import site.
- [x] **Dev seed:** `supabase/seed/sample_history.sql` adds 30 days of history to one account, chosen by email.
- **Dashboard setup** (not doable from code):
  - Authentication → URL Configuration: set Site URL to `http://localhost:3001`. Add `http://localhost:3001/confirm` and `http://localhost:3001/reset-password` as redirect URLs, plus production equivalents later.
  - Enable the Google provider (Google Cloud OAuth client, redirect URI `https://wibtmzslxwrbymdksmse.supabase.co/auth/v1/callback`).
  - Decide whether email confirmation is on; both flows are handled.

### Phase 4: Timeline
- [ ] Period model (day, week, 30 days, year, all; offset), keys `D/W/M/Y/A` and `←/→`, prev/next disabled rules.
- [ ] `TimelineStats`: average vs previous period, check-ins per day, stability (standard deviation) or range, most-logged tag.
- [ ] Line modes (entries, daily averages with min/max band, monthly with p10/p90 band), journey start markers, tooltips (entry/day/month variants).
- [ ] `YearHeatmap` with legend.
- [ ] `JourneyLanes`, best/lowest moments, `PatternList` (time-of-day, best tag, low-note tag). Analytics live in `utils/analytics/` with unit tests.
- Journeys data is still a fixture until Phase 6; lanes render from the same typed shape.

### Phase 5: Journal
- [ ] Migration 3.
- [ ] Feed grouped by day with month headers, a day rail (mini bars, journey chips) and items (check-in, long entry, journey event).
- [ ] Search, mood and tag filters, the "With notes / Every check-in" toggle, the active-filter line, "Show earlier days" paging (8 days per page; query by date window).
- [ ] `OnThisDay` (same date 1 and 2 years ago).
- [ ] `JournalComposer` (key `W`, word count, Newsreader textarea, Save to today / Discard).

### Phase 6: Journeys (list and creation)
- [ ] Migration 4.
- [ ] List view: climbing now (`CheckpointTrack` log-scale, mood vs before, why quote), attempts bars, behind you, key `N`.
- [ ] Wizard steps 1–4 with `Stepper`: What, Why, Rules (REMOVE / ALLOWED columns with flip, delete, add, and a "suggested" flag), Floors (name, 30/60/90 length, toggleable checkpoints, expectation copy, disclaimer). Then "Begun".
- [ ] **Rule suggestions:** port the design's rule-based `parse()` as a local placeholder behind an interface (`suggestRules(text)`), so AI can replace it later without UI changes.
- [ ] Sidebar "Active journeys" uses real data.

### Phase 7: Journey detail (the climb)
- [ ] `/journeys/[id]`: breadcrumb, serif "Day N" and title, attempt line.
- [ ] `JourneyClimb`: vertical steps column with the progress tube, "You are here", the previous days' ticks, and faded future floors. Progress is computed from `started_at` and the checkpoints, to the hour, as in the design.
- [ ] `JourneyNextFloor`: "Often reported" vs "Your entries", hedged copy only.
- [ ] `JourneyMoodChart`: daily average vs the pre-journey baseline, phase averages.
- [ ] `JourneyNotes`, `JourneyWhy`.
- [ ] **Record a setback:** the flow is not designed (Q6). It will be extrapolated as a small panel or modal in the existing style: "What happened?", an optional note, then Continue or Restart. **Edit rules** reuses `RuleColumn`.

### Phase 8: Insights
- [ ] Range 30d / 90d / 1y / all.
- [ ] Worth noticing, with an evidence meter: strong (≥120 entries), some (≥40), otherwise early signal.
- [ ] Hour chart with IQR band, lowest/highest callouts, weekday bars.
- [ ] Tag context diverging table with selected-tag card ("change over the next 4 hours").
- [ ] Before/during dumbbell rows.
- [ ] Footer disclaimer.
- All maths goes in `utils/analytics/insights.ts` with tests.

### Phase 9: Year review
- [ ] Year selector (partial years flagged).
- [ ] Hero.
- [ ] Weekly arc chart with best/hardest month highlights, hover tooltip and journey lanes.
- [ ] Six superlatives.
- [ ] Month-by-month hairline grid.
- [ ] Moments worth keeping.
- [ ] Tags and journeys columns.
- [ ] Templated reflection. This is deterministic text from data; AI may replace it later.

### Phase 10+: AI (behind the scenes, never a chat UI)
- Server routes in `server/api/ai/*`, with keys server-side only. Uses: rule parsing, checkpoint expectations, period summaries, the year reflection, and notices.
- **Wording requirements:**
  - Always hedged ("you may notice", "some people experience").
  - Always correlation, never causation.
  - Every suggestion is editable and must be confirmed by the user.
- **Caching:** AI results are cached in a table so pages don't call the model on every render.

**Explicitly deferred until designed or requested:** Settings, ⌘K search palette, data export and delete (promised in the signup copy, so it must exist before public launch), notifications, and Pro icons.

---

## 8. Design inconsistencies to normalise (proposed defaults)

| # | Observation | Proposed handling |
|---|---|---|
| 1 | Brand in the design is **"baseline"**; the repo is **Ascent**. | Keep the design's wordmark until told otherwise, behind one constant (`APP_NAME`). **Q1** |
| 2 | The journey detail uses its own greys: `#8E8C88`, `#737373`, `rgba(59,59,59,.6)` dividers. Other pages use `#8F8D88` and white-alpha hairlines. | Keep them as journey-scoped tokens (faithful), unless you prefer unifying. **Q2** |
| 3 | Insights Y-axis labels are placed at fixed percentages that don't match the gridlines. | Derive both from the same scale (a bug fix, not a redesign). |
| 4 | The Year review sidebar shortcut colour is not highlighted when active, unlike other pages. | Use the consistent active style. |
| 5 | Year review is not in the mobile bottom nav; it is reachable only from the top bar. | Keep as designed. |
| 6 | The Year reflection uses Newsreader upright 300, but only italic is loaded. | Load the upright 300 weight so it renders as intended. |
| 7 | Section labels vary between 10.5px `#6E6C68` and 11px `#7C7A75`. | Keep both, as `SectionLabel` `size="sm" \| "md"`. |
| 8 | The sidebar active-journey dot is amber, but journeys are sage elsewhere. | Store a per-journey `color` (the design shows amber and Low-blue dots); keep sage as the progress colour. |
| 9 | Today v1 tower. | Not implemented (superseded). |
| 10 | Selected chip background is warm .1 on Today and .08 on Journal. | One chip style, using Today's .1 value. |
| 11 | Only the first active journey's dot glows in the sidebar. | Kept: the glow marks the first journey in the list. |
| 12 | "Open timeline →" and "Journal →" links have no hover state in the design. | They brighten to `#ECEAE5` on hover, as other quiet controls do. |
| 13 | Several design elements are content-box (chart dots, tooltip 260 + padding, lane 22 + border). | Kept at the design's rendered size; content-box is used locally where that's clearer. |
| 14 | Auth shows "Continue with Google" and "Continue with Apple". | Apple removed by decision; Google keeps the design's button styling and spacing. |

---

## 9. Open questions (with the default we'll use if unanswered)

1. **Name:** is the product "baseline" (as in the design) or "Ascent"? *Default: show "baseline" via a single constant.*
2. **Journey greys:** keep the journey-detail palette exactly as designed, or unify with the rest? *Default: keep exactly.*
3. **Icons:** should the CSS-drawn glyphs (bottom-nav icons, text arrows ← → × ✓) stay as designed, or be replaced by Font Awesome equivalents? *Default: keep the design's glyphs, and use FA for new or functional icons.*
4. **OAuth:** ~~Google and Apple~~ **Resolved:** Google only; Apple removed.
5. **⌘K "Search entries":** build the palette (undesigned), or route to the Journal search for now? *Default: route to `/journal` with the search focused.*
6. **Setback flow and Settings** are not designed. Is it OK to extrapolate from the established style when we reach them? *Default: yes, minimal and in-style.*
7. **Timezone:** use the browser timezone stored on the profile for day boundaries? *Default: yes.*
