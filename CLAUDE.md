# CLAUDE.md — U·DUMP

## What This Is

U·Dump is a luxury competitive toilet analytics app. Smart toilet seat + social app. Tracks dump weight, maintains leaderboards, lets you "claim" friends' toilets with bigger dumps, and sends alerts when someone's been on the throne too long.

**Design philosophy:** Dead serious health app UX. The comedy is purely in the subject matter. NO poop emoji in the UI. NO joke fonts. Think Apple Health meets competitive fitness — except the sport is pooping.

**Brand voice:** "Originally conceived 2016. Finally shipped 2026. You're welcome."

## Authoritative Spec Files

These files contain the COMPLETE, pixel-level build specification. They are the single source of truth:

1. **`UDUMP_BUILD_SPEC.md`** — Full design system (colors, typography, glass card + gold button components), complete Supabase schema with RLS policies, pixel-level screen specs for 8 screens, Dump Score™ algorithm, 20 achievements with tier colors, notification copy strings
2. **`UDUMP_ROADMAP.md`** — Phase-by-phase build order (15 phases), agent prompts per phase, code snippets, verification criteria
3. **`udump-v4.html`** — Visual mockup of the marketing/landing page with exact CSS variables for the design system

**When in doubt, the BUILD_SPEC wins.** It overrides anything in this file or PLAN.md.

## Stack

- **Framework:** React Native + Expo (SDK 53+)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **Backend:** Supabase (auth, database, realtime, push notifications, Edge Functions)
- **State:** Zustand (NOT React Context)
- **Animations:** Reanimated 3
- **Glass effects:** expo-blur BlurView for all glass card effects
- **Haptics:** expo-haptics on all interactions
- **Charts:** victory-native
- **Lists:** @shopify/flash-list
- **Styling:** StyleSheet.create — NO inline styles

## Commands

```bash
npx expo start           # Dev server
npx expo run:ios         # iOS build
npx expo run:android     # Android build
npx expo lint            # Lint before committing
eas build --platform ios --profile preview  # TestFlight build
```

## Architecture

```
app/
  _layout.tsx               # Root layout, providers
  +not-found.tsx
  (auth)/
    _layout.tsx             # Auth stack layout
    welcome.tsx             # 3-panel onboarding
    login.tsx
    signup.tsx
    username.tsx            # Pick username (post-signup)
    throne-name.tsx         # Name home throne (optional)
  (tabs)/
    _layout.tsx             # Tab bar layout
    index.tsx               # Home — greeting, START SESSION, stats, feed peek
    activity.tsx            # Social feed with realtime
    social.tsx              # Friends + leaderboard
    thrones.tsx             # Throne map
  session/
    active.tsx              # Active session timer + sonar rings
    results.tsx             # Results screen (3 states)
  profile/
    index.tsx               # Profile + settings
    achievements.tsx        # Achievement grid
    analytics.tsx           # Dump Score™ analytics

constants/
  colors.ts                 # Full design system from BUILD_SPEC
  typography.ts
  achievements.ts           # All 20 achievements

lib/
  supabase.ts               # Supabase client init (SecureStore)
  store/
    user.store.ts           # Zustand user store
    session.store.ts        # Zustand session store
  utils/
    checkAchievements.ts
    notifications.ts
    dumpScore.ts            # Dump Score™ algorithm

components/
  ui/
    GlassCard.tsx           # blur + border + gradient overlay
    GoldButton.tsx          # gradient gold button
    StatCard.tsx
    Badge.tsx
    Avatar.tsx
    TabBar.tsx              # Custom tab bar
```

## Database Schema

**See UDUMP_BUILD_SPEC.md for the complete SQL schema with RLS policies.**

Key tables: `profiles`, `dump_sessions`, `thrones`, `friendships`, `user_achievements`, `notification_events`

## Non-Negotiable Rules

1. **Bobby is always last** in seed data and leaderboards. His stats are the worst. This is the joke.
2. **No poop emoji in the UI.** Crown emoji only. Gold accents. Luxury aesthetic.
3. **Zustand for state**, not React Context
4. **Reanimated 3 for ALL animations** — no Animated API
5. **expo-blur BlurView** for all glass effects
6. **All colors from constants/colors.ts** — NEVER hardcode hex
7. **All typography from constants/typography.ts** — NEVER hardcode font strings
8. **StyleSheet.create only** — NO inline styles
9. **Commit after every completed phase**
10. **Push directly to main** — no feature branches

## Design System (Quick Reference)

See BUILD_SPEC for full token list. Key colors:
- Void: `#06060A` (deepest background)
- Base: `#0C0C12` (primary background)
- Gold: `#D4AF37` (primary accent)
- Gold Light: `#F0CE60` (highlight accent)
- Glass borders: `rgba(255,255,255,0.08)`

Fonts: Barlow Condensed (display), Barlow (body), DM Mono (data/numbers)

## Dev Phases

See PLAN.md for task checklist. See UDUMP_ROADMAP.md for detailed per-phase agent prompts and code snippets.
