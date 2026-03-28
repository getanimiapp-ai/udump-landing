# CLAUDE.md — U Dump

## What This Is

U Dump is a novelty social app + future smart toilet seat product. The app tracks dump weight, maintains leaderboards, lets you "claim" friends' toilets with bigger dumps, and sends alerts when someone's been on the throne too long.

Think: Strava for pooping. Disgusting and viral.

## Stack

- **Framework:** React Native + Expo (SDK 53+)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **Backend:** Supabase (auth, database, realtime, push notifications)
- **State:** React Context + hooks
- **Styling:** StyleSheet.create — NO inline styles
- **Design:** Dark theme, bold/irreverent, toilet humor aesthetic. Think meme energy.

## Commands

```bash
npx expo start           # Dev server
npx expo run:ios         # iOS build
npx expo run:android     # Android build
```

## Architecture

```
src/
  app/              # Expo Router pages
    (tabs)/          # Tab navigation
      index.tsx      # Home — recent dumps + quick log
      leaderboard.tsx # Friends + global rankings
      thrones.tsx    # Toilets you've claimed
      profile.tsx    # Your stats + history
    dump/
      log.tsx        # Log a dump (weight entry)
      [id].tsx       # Dump detail
    social/
      friends.tsx    # Friend list + add friends
      alerts.tsx     # Throne alerts
    auth/
      login.tsx
      signup.tsx
  components/        # Reusable components
  lib/               # Supabase client, helpers
  contexts/          # Auth, user, friends contexts
  theme/             # Colors, fonts, spacing constants
  types/             # TypeScript types
```

## Database Schema (Supabase)

### users
- id (uuid, PK, from auth)
- username (text, unique)
- display_name (text)
- avatar_url (text, nullable)
- created_at (timestamptz)

### toilets
- id (uuid, PK)
- owner_id (uuid, FK → users)
- name (text) — e.g. "Jake's Downstairs Bathroom"
- location_label (text, nullable)
- current_throne_holder_id (uuid, FK → users, nullable)
- throne_weight (numeric) — the record to beat
- created_at (timestamptz)

### dumps
- id (uuid, PK)
- user_id (uuid, FK → users)
- toilet_id (uuid, FK → toilets, nullable) — null = unknown toilet
- weight_before (numeric) — lbs/kg
- weight_after (numeric)
- dump_weight (numeric, generated) — weight_before - weight_after
- duration_seconds (integer, nullable)
- notes (text, nullable)
- photo_url (text, nullable) — trophy shots lmao
- created_at (timestamptz)

### friendships
- id (uuid, PK)
- requester_id (uuid, FK → users)
- addressee_id (uuid, FK → users)
- status (text) — pending, accepted, blocked
- created_at (timestamptz)

### throne_claims
- id (uuid, PK)
- toilet_id (uuid, FK → toilets)
- claimer_id (uuid, FK → users)
- dump_id (uuid, FK → dumps)
- previous_holder_id (uuid, FK → users, nullable)
- claimed_at (timestamptz)

### alerts
- id (uuid, PK)
- user_id (uuid, FK → users) — the person ON the toilet
- toilet_id (uuid, FK → toilets)
- started_at (timestamptz)
- ended_at (timestamptz, nullable)
- alert_sent (boolean, default false)
- alert_threshold_minutes (integer, default 10)

## Key Features (Priority Order)

1. **Log a Dump** — Enter weight before/after (manual for now, hardware later). Shows dump weight with celebratory/disgusting animation.
2. **Leaderboard** — Friends leaderboard (biggest single dump, weekly total, all-time). Global leaderboard.
3. **Claim the Throne** — Register your toilet. Friends can dump on it. Biggest dump claims the throne. Push notification to dethroned owner.
4. **Throne Alerts** — Start a "session." If you exceed the time threshold, friends get notified. "Jake has been on the throne for 14 minutes."
5. **Social Feed** — Recent dumps from friends (opt-in). Reactions (💩🏆👑🫡).
6. **Friend System** — Add by username, see their stats, challenge them.
7. **Stats & History** — Personal dump history, trends, averages, personal records.
8. **Achievements** — "First Dump," "Throne Claimer," "10 lb Club," "Speed Run" (under 60 seconds), "Marathon" (30+ minutes).

## Design Rules

- Dark theme with gold/brown accent colors (on brand)
- All colors in theme/colors.ts — NEVER hardcode hex
- All fonts in theme/fonts.ts
- All spacing in theme/spacing.ts
- Bold, irreverent copy. This is a joke app — lean into it.
- Toilet emoji 🚽, crown emoji 👑, poop emoji 💩 are the brand icons
- Animations for big dumps, throne claims, and achievements
- Sound effects optional but encouraged

## Agent Guardrails

- Push directly to main
- Commit after every completed feature
- Run `npx expo lint` before committing
- Follow the Playbook phases: design system → architecture → screens
- NO inline styles — use StyleSheet.create
- All API calls through Supabase client in lib/supabase.ts

## Dev Phases

See PLAN.md for the full task breakdown.
