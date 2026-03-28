# PLAN.md — U·DUMP Build Plan

## How to Use This Plan

Each Claude Code session should:
1. `git pull --rebase` first
2. Read CLAUDE.md, UDUMP_BUILD_SPEC.md, and UDUMP_ROADMAP.md
3. Pick the next unchecked phase
4. Complete it fully (code + lint + commit + push)
5. Check it off `[x]`
6. Move to next phase

Phases MUST be completed in order. The ROADMAP has detailed agent prompts and code snippets for each phase.

---

## Phase 0: Environment Setup (Manual — not an agent task)

- [ ] **0.1 — Apple Developer Account** — App ID: `com.udump.app`
- [ ] **0.2 — Supabase Project** — Create `udump-production`, save URL + keys
- [ ] **0.3 — Expo Account** — Create project `u-dump`, install EAS CLI
- [ ] **0.4 — Environment File** — `.env.local` with Supabase + Expo credentials

---

## Phase 1: Project Scaffold

- [x] **1.1 — Expo Init + Dependencies**
  - `npx create-expo-app@latest udump --template blank-typescript`
  - Install all dependencies from ROADMAP Phase 1
  - Configure app.json (bundle ID, permissions, plugins)
  - Configure eas.json
  - **Done when:** `npx expo start` runs clean

- [x] **1.2 — Design System + Constants**
  - `constants/colors.ts` — full palette from BUILD_SPEC
  - `constants/typography.ts` — Barlow Condensed, Barlow, DM Mono
  - `constants/achievements.ts` — all 20 achievements with tiers
  - **Done when:** all tokens importable

- [x] **1.3 — Core UI Components**
  - `GlassCard.tsx` — blur + border + gradient
  - `GoldButton.tsx` — gradient gold
  - `StatCard.tsx`, `Badge.tsx`, `Avatar.tsx`
  - **Done when:** components render in isolation

---

## Phase 2: Supabase Backend

- [x] **2.1 — Schema + RLS** — deployed manually by Aaron
  - All 6 tables live: profiles, dump_sessions, thrones, friendships, user_achievements, notification_events
  - RLS active, verified via API (all return 200)
  - Fixed schema: `supabase/migrations/001_initial_schema_fixed.sql`

- [ ] **2.2 — Seed Data** — skipped, will populate with real users per Aaron
  - `supabase/migrations/002_seed_data.sql` available when needed

- [x] **2.3 — Storage + Realtime + Edge Functions**
  - Realtime enabled on dump_sessions, notification_events, thrones
  - Edge Functions: send-notification, check-overstay, update-throne (code in supabase/functions/)
  - Deploy when ready: `supabase functions deploy --project-ref kogtiulxfqzuesllwjzz`

---

## Phase 3: Auth Flow

- [x] **3.1 — Auth Screens**
  - welcome.tsx (3-panel onboarding)
  - login.tsx, signup.tsx
  - username.tsx (pick username post-signup)
  - throne-name.tsx (name home throne, optional)
  - Supabase auth with SecureStore persistence
  - **Done when:** full signup → username → throne → home flow works

---

## Phase 4: Tab Navigation + Home Screen

- [x] **4.1 — Custom Tab Bar**
  - 4 tabs: Home, Activity, Social, Thrones
  - Gold active state, blur background, haptic feedback
  - **Done when:** tabs navigate correctly

- [x] **4.2 — Home Screen**
  - Time-aware greeting
  - START SESSION button (gold gradient, pulsing)
  - Stats row (today count, today weight, streak)
  - Last session card
  - **Done when:** renders with real Supabase data

---

## Phase 5: Session Flow (Core Feature)

- [x] **5.1 — Active Session Screen**
  - Timer with sonar rings animation
  - Weight entry (before/after) on end
  - Overstay detection (60min, 120min)
  - **Done when:** timer works, weight entry saves

- [x] **5.2 — Results Screen**
  - 3 states: standard, personal record, throne claim
  - Crown animation with spring physics
  - Session save + throne check + score update
  - **Done when:** full end-to-end session flow works

---

## Phase 6: Social Feed + Realtime

- [x] **6.1 — Activity Feed**
  - Realtime Supabase subscription for friend sessions
  - 4 FeedItem types: session, record, throne_claimed, overstay
  - Quick reply chips for overstay alerts
  - Filter chips: All, Records, Thrones, Alerts
  - **Done when:** friend sessions appear in real time

---

## Phase 7: Leaderboard

- [x] **7.1 — Friends + Global Leaderboard**
  - Friends tab: ranked by all-time total weight
  - Global tab: top 100 all-time
  - Rank 1 gold crown, rank 2 silver, rank 3 bronze
  - Bobby always last (red tint on his row)
  - Integrated into Social tab (Feed / Leaderboard switcher)
  - **Done when:** real ranked data from Supabase

---

## Phase 8: Throne Map

- [x] **8.1 — Map + Throne Claiming**
  - react-native-maps with dark style
  - Custom pins (gold crown = yours, white = unconquered, red = lost)
  - GPS proximity check (50m) for claiming
  - Bottom sheet with throne list
  - **Done when:** map shows pins, claiming works, notifications fire

---

## Phase 9: Achievements System

- [x] **9.1 — Achievement Logic + Screen**
  - checkAndUnlockAchievements runs after every session
  - All 20 achievements from BUILD_SPEC
  - Achievement screen with tier filters (Bronze/Silver/Gold/Platinum)
  - Unlock animation overlay
  - Secret achievements stay hidden until earned
  - **Done when:** achievements trigger correctly

---

## Phase 10: Dump Score™ Analytics

- [x] **10.1 — Analytics Screen**
  - Animated score ring (SVG arc)
  - Score trend chart (victory-native, 30 days)
  - Factor breakdown (4 glass cards with progress bars)
  - Deterministic insight copy based on score range
  - Session history log
  - **Done when:** score renders, animates, factors display

---

## Phase 11: Push Notifications

- [x] **11.1 — All 7 Notification Types**
  - Expo push token registration
  - record_broken, throne_claimed, throne_lost, overstay_60, overstay_120, friend_active, streak_milestone
  - Overstay pg_cron (every 5 min)
  - **Done when:** all 7 types send and deep link correctly

---

## Phase 12: Profile + Settings

- [x] **12.1 — Profile Screen**
  - Avatar upload, display name, username
  - Dump Score™, global ranking
  - Stats row, achievements preview
  - Recent sessions
  - Notification preferences toggles
  - Friends management (search, add, accept/decline)
  - **Done when:** profile loads, avatar works, friends manageable

---

## Phase 13: Polish + Animations

- [x] **13.1 — Animation Pass**
  - All animations from ROADMAP Phase 13 (home stagger, session pulse, results spring, achievement unlock, tab bounce)
  - Skeleton loaders (no spinners)
  - Personality-driven empty/error states
  - **Done when:** app feels smooth, no janky transitions

---

## Phase 14: TestFlight Submission

- [ ] **14.1 — Build + Submit**
  - Final config check (bundle ID, permissions, version)
  - `eas build --platform ios --profile preview`
  - `eas submit --platform ios --latest`
  - EAS secrets configured
  - Supabase production checklist (RLS, Edge Functions, pg_cron, realtime, storage)
  - **Done when:** build processes in App Store Connect

---

## Phase 15: Tester Onboarding

- [ ] **15.1 — Seed + Invite**
  - Create Bobby's account first, register his home throne
  - Aaron claims Bobby's throne before anyone else joins
  - Add internal testers: Aaron, Shelden, Nick, Bobby, Jake, Garret
  - Send group text with instructions
  - **Done when:** all testers installed, Bobby is last, throne is claimed
