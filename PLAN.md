# PLAN.md — U Dump

## How to Use This Plan

Each Claude Code session should:
1. `git pull --rebase` first
2. Read CLAUDE.md for architecture and conventions
3. Pick the next unchecked task in phase order
4. Complete it fully (code + lint + commit + push)
5. Check it off `[x]`
6. Move to next task

Phases MUST be completed in order. Tasks within a phase can run in parallel unless noted.

---

## Phase 1: Foundation

- [ ] **1.1 — Expo Project Init**
  - `npx create-expo-app udump --template tabs` or manual setup with Expo Router
  - TypeScript, Expo SDK 53+
  - File-based routing under `src/app/`
  - **Done when:** `npx expo start` runs clean, tab navigation works

- [ ] **1.2 — Design System**
  - Create `src/theme/colors.ts` — dark theme, gold/brown accents, poop-brand palette
  - Create `src/theme/fonts.ts` — bold display font + clean body font
  - Create `src/theme/spacing.ts` — consistent scale
  - Create `src/theme/index.ts` — re-export everything
  - Write `DESIGN.md` with full token reference
  - **Done when:** DESIGN.md exists and all tokens are importable

- [ ] **1.3 — Supabase Setup**
  - Create `src/lib/supabase.ts` with Expo-compatible client (AsyncStorage)
  - Create migration files for all tables from CLAUDE.md schema
  - Set up RLS policies (users can read friends' data, write own data)
  - Add `.env` template with SUPABASE_URL and SUPABASE_ANON_KEY
  - **Done when:** Supabase client connects, tables exist, RLS works

- [ ] **1.4 — Auth Flow**
  - Login screen (email/password + Apple Sign In + Google Sign In)
  - Signup screen with username picker (check uniqueness)
  - Auth context provider wrapping the app
  - Protected routes redirect to login
  - **Done when:** Can sign up, log in, log out, session persists

---

## Phase 2: Core Features

- [ ] **2.1 — Log a Dump**
  - Weight before/after input (numeric keypad, lbs or kg toggle)
  - Calculate dump weight
  - Optional: duration timer (auto-start on entry, tap to stop)
  - Optional: notes field, toilet selector
  - Celebratory animation on submit (confetti 💩, bigger = more dramatic)
  - Save to `dumps` table
  - **Done when:** Can log a dump, see it saved, animation plays

- [ ] **2.2 — Home Feed**
  - Recent dumps from you and friends (opt-in visibility)
  - Each dump card shows: user, weight, time ago, toilet (if registered)
  - Reaction buttons (💩🏆👑🫡)
  - Pull to refresh
  - **Done when:** Feed loads, shows real data, reactions work

- [ ] **2.3 — Leaderboard**
  - Tabs: Friends / Global
  - Filters: Biggest Single, Weekly Total, All-Time Total, Average
  - Ranked list with position, username, avatar, stat
  - Your rank highlighted
  - **Done when:** Leaderboard shows real ranked data from Supabase

- [ ] **2.4 — Friend System**
  - Search by username
  - Send/accept/decline friend requests
  - Friends list with stats preview
  - Unfriend option
  - Uses `friendships` table with realtime subscription
  - **Done when:** Can add friends, see their dumps on feed and leaderboard

---

## Phase 3: Signature Features

- [ ] **3.1 — Toilets & Throne System**
  - Register a toilet (name it, e.g. "Master Bath")
  - QR code for each toilet (friends scan to check in)
  - Current throne holder displayed on toilet card
  - Auto-claim: if your dump on someone's toilet beats the record, you claim the throne
  - Push notification to dethroned owner: "[User] just claimed your throne with a [X] lb dump!"
  - Throne history log
  - **Done when:** Can register toilet, dump on friend's toilet, auto-claim works, push notification sent

- [ ] **3.2 — Throne Alerts**
  - "Start Session" button when you sit down
  - Timer runs, visible only to you
  - After threshold (default 10 min), friends get alert: "[User] has been on the throne for 14 minutes"
  - Configurable threshold per user
  - End session manually or auto-timeout at 60 min
  - **Done when:** Session timer works, friends receive alert after threshold

- [ ] **3.3 — Achievements**
  - Achievement definitions:
    - First Dump, Throne Claimer, 10 lb Club, Speed Run (<60s), Marathon (30+ min)
    - Regular (5 days streak), Ironman (30 days streak), Social Dumper (10 friend toilets)
    - Dethroned (lost your throne), Reclaimer (won it back)
  - Pop-up animation when earned
  - Achievement showcase on profile
  - **Done when:** Achievements trigger correctly, display on profile

- [ ] **3.4 — Stats & History**
  - Personal dump history (calendar view + list)
  - Trends: average dump weight over time (chart)
  - Personal records: biggest, smallest, fastest, longest
  - Weekly/monthly summaries
  - **Done when:** Stats page shows real data with charts

---

## Phase 4: Polish & Launch

- [ ] **4.1 — Push Notifications**
  - Expo Push Notifications setup
  - Notification types: throne claimed, throne alert, friend request, achievement
  - Notification preferences screen
  - **Done when:** Push notifications deliver on iOS and Android

- [ ] **4.2 — Onboarding**
  - 3-4 screen walkthrough: "Welcome to U Dump" → "Log Your Dumps" → "Claim Thrones" → "Add Friends"
  - Only shows once (AsyncStorage flag)
  - **Done when:** Onboarding flow runs on first launch, skips after

- [ ] **4.3 — App Store Polish**
  - App icon (toilet + crown)
  - Splash screen
  - App Store screenshots
  - Privacy policy (no real health data, it's a joke)
  - **Done when:** All assets created, app builds for submission

- [ ] **4.4 — QR Code System**
  - Generate QR per toilet (links to toilet check-in)
  - Camera scanner to scan friend's toilet QR
  - Deep link handling
  - **Done when:** QR generates, scans work, deep links to correct toilet

---

## Out of Scope (Future / Hardware Phase)

- Smart toilet seat with load cells (auto-weigh)
- Bluetooth integration (ESP32)
- Apple Health / Google Fit integration
- Sponsored leaderboards / brand partnerships
- NFT throne certificates (lol)
