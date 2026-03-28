# U·DUMP — Complete A-Z Build Roadmap
### From zero to TestFlight. Hand this to Claude Code agents in order.

---

## AGENT INSTRUCTIONS (READ FIRST)

Each phase below is a self-contained Claude Code session. Start a fresh session for each phase.
At the start of every session, tell Claude Code:
> "Read UDUMP_BUILD_SPEC.md and UDUMP_ROADMAP.md before doing anything."

Keep both files in the repo root. Agents will reference them constantly.

**Golden rules:**
- Never skip a phase. Each one unblocks the next.
- Commit after every phase: `git commit -m "phase X: [name] complete"`
- Test on a real iPhone before moving to the next phase. Simulator is not enough.
- Bobby is always last in seed data. This is non-negotiable.

---

## PHASE 0 — ENVIRONMENT SETUP
### Do this yourself. Not an agent task.

**A. Apple Developer Account**
1. Enroll at developer.apple.com ($99/yr) if not already
2. Create App ID: `com.udump.app`
3. Create provisioning profile for development

**B. Supabase Project**
1. Go to supabase.com → New project
2. Name: `udump-production`
3. Region: pick closest to you (us-east-1 or us-west-2)
4. Save: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
5. Save: `SUPABASE_SERVICE_ROLE_KEY` (for Edge Functions)

**C. Expo Account**
1. expo.dev → create account if needed
2. Create project: `u-dump`
3. Note your `EXPO_PROJECT_ID`
4. Install EAS CLI: `npm install -g eas-cli`
5. `eas login`

**D. Local Environment**
```bash
# Install dependencies
brew install node watchman
npm install -g expo-cli eas-cli

# Clone/init repo
mkdir udump && cd udump
git init
git remote add origin [your-github-repo]
```

**E. Environment File (`.env.local` — never commit this)**
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EXPO_PUBLIC_EXPO_PROJECT_ID=xxxx-xxxx-xxxx
```

---

## PHASE 1 — PROJECT SCAFFOLD
### Agent prompt: "Scaffold the U·Dump Expo project from scratch"

**What to build:**
```bash
# Agent runs:
npx create-expo-app@latest udump --template blank-typescript
cd udump

# Install all dependencies
npx expo install expo-router expo-blur expo-haptics expo-location \
  expo-notifications expo-secure-store expo-image-picker \
  react-native-reanimated react-native-gesture-handler \
  react-native-safe-area-context react-native-screens \
  react-native-svg react-native-maps @supabase/supabase-js \
  zustand @tanstack/react-query react-native-ble-plx \
  victory-native expo-linear-gradient react-native-mmkv \
  @shopify/flash-list date-fns
```

**Files agent creates:**
```
app.json                    ← Expo config (bundle ID, permissions)
eas.json                    ← EAS build config
.env.local                  ← (template only, real values from you)
babel.config.js
tsconfig.json

app/
  _layout.tsx               ← Root layout, providers
  +not-found.tsx

constants/
  colors.ts                 ← Full design system from BUILD_SPEC
  typography.ts
  achievements.ts           ← All 20 achievements

lib/
  supabase.ts               ← Supabase client init
  store/
    user.store.ts           ← Zustand user store
    session.store.ts        ← Zustand session store
  
components/
  ui/
    GlassCard.tsx
    GoldButton.tsx
    StatCard.tsx
    Badge.tsx
    Avatar.tsx
```

**app.json must include:**
```json
{
  "expo": {
    "name": "U·Dump",
    "slug": "udump",
    "version": "1.0.0",
    "scheme": "udump",
    "bundleIdentifier": "com.udump.app",
    "ios": {
      "supportsTablet": false,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "U·Dump uses your location to register and claim thrones.",
        "NSBluetoothAlwaysUsageDescription": "U·Dump connects to your sensor ring via Bluetooth.",
        "NSBluetoothPeripheralUsageDescription": "U·Dump connects to your sensor ring via Bluetooth."
      }
    },
    "plugins": [
      "expo-router",
      "expo-location",
      "expo-notifications",
      [
        "react-native-ble-plx",
        {
          "isBackgroundEnabled": false,
          "modes": ["peripheral", "central"],
          "bluetoothAlwaysPermission": "Allow U·Dump to connect to your sensor ring"
        }
      ]
    ]
  }
}
```

**eas.json:**
```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "buildConfiguration": "Release" }
    },
    "production": {
      "ios": { "buildConfiguration": "Release" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Verify:** `npx expo start` runs, no errors. 

---

## PHASE 2 — SUPABASE BACKEND
### Agent prompt: "Set up the complete Supabase backend for U·Dump"

**Step 1: Run schema**
Agent pastes the complete SQL from UDUMP_BUILD_SPEC.md into Supabase SQL editor and runs it.

**Step 2: Seed data (for testing)**
```sql
-- Seed users (test accounts)
-- These match TestFlight testers: Aaron, Shelden, Nick, Bobby, Jake, Garret

-- After creating auth users manually in Supabase dashboard,
-- run this to set up their profiles:

insert into profiles (id, username, display_name, dump_score, streak_days) values
  ('uuid-aaron',   'aaron',   'Aaron',   9.2, 14),
  ('uuid-shelden', 'shelden', 'Shelden', 8.7, 11),
  ('uuid-nick',    'nick',    'Nick',    9.8, 22),  -- holds global record
  ('uuid-bobby',   'bobby',   'Bobby',   3.1, 2),   -- always last
  ('uuid-jake',    'jake',    'Jake',    7.4, 8),
  ('uuid-garret',  'garret',  'Garret',  6.9, 5);   -- famous for overstays

-- Seed thrones
insert into thrones (id, name, owner_user_id, current_king_id, current_king_weight_lbs, lat, lng) values
  (gen_random_uuid(), 'Bobby''s Throne',   'uuid-bobby',  'uuid-aaron',  3.1, 39.7684, -86.1581),
  (gen_random_uuid(), 'Shelden''s Throne', 'uuid-shelden','uuid-shelden',2.8, 39.7720, -86.1580),
  (gen_random_uuid(), 'Nick''s Throne',    'uuid-nick',   'uuid-nick',   4.1, 39.7700, -86.1600),
  (gen_random_uuid(), 'Jake''s Throne',    'uuid-jake',   'uuid-jake',   2.4, 39.7650, -86.1550);

-- Seed friendships (everyone is friends with everyone)
-- Run for each pair combination

-- Seed sessions (recent history for each user)
-- Bobby has worst stats, Nick has best
```

**Step 3: Storage bucket**
```sql
-- In Supabase Storage, create bucket: 'avatars'
-- Set to public
-- RLS: users can upload to their own folder
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
```

**Step 4: Realtime**
Enable realtime on these tables in Supabase dashboard:
- `dump_sessions` (for live friend activity feed)
- `notification_events` (for push triggers)
- `thrones` (for throne claim updates)

**Step 5: Edge Functions**
```
supabase/functions/
  send-notification/index.ts     ← Sends Expo push notifications
  check-overstay/index.ts        ← Cron: checks active sessions > 60min
  calculate-dump-score/index.ts  ← Recalculates score after each session
  update-throne/index.ts         ← Handles throne claim logic
```

**send-notification/index.ts:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, title, body, data } = await req.json()
  
  const message = {
    to,
    sound: 'default',
    title,
    body,
    data: data || {},
    priority: 'high',
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  const result = await response.json()
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**check-overstay/index.ts (runs every 5 min via pg_cron):**
```typescript
// Finds sessions where:
// - ended_at is null (still active)
// - started_at was > 60 minutes ago
// - notification hasn't been sent yet
// → Calls send-notification for all friends of that user
```

Deploy functions: `supabase functions deploy --project-ref [your-ref]`

**Verify:** Test auth signup works, profiles table populates, realtime events fire.

---

## PHASE 3 — AUTH FLOW
### Agent prompt: "Build the U·Dump authentication screens"

**Screens:**
```
app/(auth)/
  _layout.tsx      ← Auth stack layout
  welcome.tsx      ← 3-panel onboarding
  login.tsx        ← Email/password login
  signup.tsx       ← Create account
  username.tsx     ← Pick username (post-signup)
  throne-name.tsx  ← Name your home throne (optional)
```

**welcome.tsx — 3 panels:**
```
Panel 1:
  [U·DUMP wordmark — huge gold]
  "Originally conceived 2016."
  "Finally shipped 2026."
  "You're welcome."
  [Begin button — gold]

Panel 2:
  "Every room in the house has gone smart."
  [Animated icons: TV, Fridge, Thermostat]
  "Every room except one."
  [Toilet icon fades in]
  "Until now."

Panel 3:
  "Track. Compete. Claim."
  [3 feature pills with icons]
  [Create Account] [I already have an account]
```

**Auth logic:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

**Root layout auth guard:**
```typescript
// app/_layout.tsx
// Check session on mount
// If no session → redirect to (auth)/welcome
// If session → redirect to (tabs)/
```

**Verify:** Full signup → username → throne name → home screen flow works.

---

## PHASE 4 — TAB NAVIGATION + HOME SCREEN
### Agent prompt: "Build the U·Dump tab navigation and home screen"

**Custom Tab Bar:**
```typescript
// components/ui/TabBar.tsx
// 4 tabs: Home (👑), Activity (📊), Social (👥), Thrones (📍)
// Active tab: gold icon + gold label
// Inactive: text3 color
// Background: rgba(6,6,10,0.88) + blur
// Height: 70px + safe area bottom
// Tab items have haptic feedback on press
```

**Home screen sections (in order):**
1. Greeting (time-aware: Good Morning/Afternoon/Evening)
2. START SESSION button (gold gradient, pulsing if BLE connected)
3. Stats row (Today count, Today weight, Streak)
4. Last session card
5. Mini friend feed (2-3 most recent friend activities)
6. Leaderboard peek (top 3 friends, gold/silver/bronze)

**Zustand store setup:**
```typescript
// lib/store/user.store.ts
interface UserStore {
  profile: Profile | null
  todayStats: { count: number; weight: number } | null
  streak: number
  dumpScore: number
  fetchProfile: () => Promise<void>
  fetchTodayStats: () => Promise<void>
}
```

**Verify:** Home screen renders with real data from Supabase, greeting updates by time.

---

## PHASE 5 — SESSION FLOW (CORE FEATURE)
### Agent prompt: "Build the complete U·Dump session flow: active session and results screens"

**Active Session screen:**
- Timer starts immediately using `Date.now()` delta, updates every second
- `setInterval` in `useEffect`, cleanup on unmount
- Weight entry: two inputs (before / after) that appear when session ends
- OR: if BLE device detected, show live weight reading instead
- Sonar rings: SVG circles expanding from center, 4s loop, very subtle opacity
- Status chip updates based on: time vs personal best, GPS location vs thrones

**Overstay detection:**
```typescript
// In active session useEffect:
useEffect(() => {
  const check60 = setTimeout(() => {
    // Trigger overstay_60 notification to all friends
    notifyFriendsOverstay(60)
  }, 60 * 60 * 1000)

  const check120 = setTimeout(() => {
    notifyFriendsOverstay(120)
  }, 120 * 60 * 1000)

  return () => {
    clearTimeout(check60)
    clearTimeout(check120)
  }
}, [])
```

**Session end logic:**
```typescript
async function endSession(weightBefore: number, weightAfter: number) {
  const duration = Math.floor((Date.now() - startTime) / 1000)
  const delta = weightBefore - weightAfter

  // 1. Save session to Supabase
  const session = await saveSession({ duration, weightBefore, weightAfter, delta })

  // 2. Check personal record
  const isRecord = delta > userBestWeight

  // 3. Check throne claim (if near a registered throne)
  const nearThrone = await checkNearbyThrone()
  const throneClaimable = nearThrone && delta > nearThrone.currentKingWeight

  // 4. Update Dump Score™
  await recalculateDumpScore()

  // 5. Check achievements
  await checkAndUnlockAchievements(session)

  // 6. Notify friends
  if (isRecord) await notifyFriends('record_broken', session)
  if (throneClaimable) // show option on results screen

  // 7. Haptics
  if (isRecord) Haptics.notificationAsync(NotificationFeedbackType.Success)

  // 8. Navigate to results
  router.push({ pathname: '/session/results', params: { sessionId: session.id } })
}
```

**Results screen — all 3 states:**
- Animate crown dropping in with spring (useAnimatedStyle + withSpring)
- Gold particle bloom: 12 tiny circles radiating from center, fade out, 800ms
- Share card: generates a snapshot-able view with user's stats

**Achievement unlock overlay:**
```typescript
// If any achievements unlocked during this session,
// show them sequentially after results
// Each achievement: slides up from bottom, 2s display, slides away
// Then next achievement
// Then results actions
```

**Verify:** Full session flow works. Record detected. Achievement unlocks. Results display correctly.

---

## PHASE 6 — SOCIAL FEED + REALTIME
### Agent prompt: "Build the U·Dump social feed with realtime updates"

**Feed data:**
```typescript
// Fetches dump_sessions for all friends
// Ordered by started_at DESC
// Joined with profiles for display names/avatars
// Realtime subscription updates feed live

const subscription = supabase
  .channel('friend-sessions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'dump_sessions',
  }, (payload) => {
    // Check if payload.new.user_id is in friends list
    // If yes, prepend to feed
  })
  .subscribe()
```

**FeedItem variants:**
```typescript
type FeedItemType = 'session' | 'record' | 'throne_claimed' | 'overstay'

// session: avatar, name, time, duration, weight
// record: gold border, trophy badge, stats
// throne_claimed: crown emoji, location name, weight
// overstay: RED border, red tint, name + duration, quick reply chips
```

**Quick reply chips (overstay only):**
- "You okay?" → sends push notification to that user
- "Need help?" → sends push notification
- "👑" → sends crown emoji notification (the best response)

**Filter chips:**
- All → all feed items
- Records → only `is_personal_record = true`
- Thrones → only `throne_claimed = true`
- Alerts → only overstay events

**Verify:** Real friend session appears in feed in real time. Filter chips work. Quick replies send.

---

## PHASE 7 — LEADERBOARD
### Agent prompt: "Build the U·Dump leaderboard with friends and global tabs"

**Two tabs:**

**Friends leaderboard:**
```typescript
// Fetch all friends + self
// Sort by: weight_delta_lbs DESC for current week
// Rank 1 = gold crown, Rank 2 = silver, Rank 3 = bronze
// Bobby is always last (this will happen naturally — his stats are worst)
// Each row: rank, avatar, name, this week's lbs, sessions count
// Tap row → view that user's public profile
```

**Global leaderboard:**
```typescript
// Fetch top 100 users globally by all-time weight
// Show user's own rank at top even if not in top 100
// "You are ranked #847 globally"
// Same display as friends leaderboard
```

**Leaderboard card design:**
```
┌─────────────────────────────────────────┐
│ 👑  1   Aaron        12.4 lbs   8 sess  │  ← gold treatment
│ 🥈  2   Shelden      10.1 lbs   7 sess  │  ← silver
│ 🥉  3   Nick          9.8 lbs   6 sess  │  ← bronze
│     4   Jake          7.2 lbs   5 sess  │
│     5   Garret        6.4 lbs   4 sess  │
│    ...                                  │
│    12   Bobby         3.1 lbs   2 sess  │  ← Bobby, last, red tint
└─────────────────────────────────────────┘
```

Bobby's row gets a subtle red tint. Not mean. Just accurate.

**Verify:** Leaderboard populates with real data. Bobby is last. Crown renders on rank 1.

---

## PHASE 8 — THRONE MAP
### Agent prompt: "Build the U·Dump throne map with GPS claiming"

**Map setup:**
```typescript
// react-native-maps with custom dark style
// Dark map JSON: use Google Maps dark style
// Or Apple Maps dark mode (automatic on iOS)

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0C0C12' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  // ... full dark style
]
```

**Custom map pins:**
```typescript
// Gold crown SVG = thrones where current user is king
// White pin = unconquered thrones
// Red pin = lost thrones (user WAS king, now someone else is)

<Marker coordinate={{ latitude, longitude }}>
  <View style={styles.customPin}>
    <Text style={{ fontSize: 24 }}>👑</Text>  {/* gold if yours */}
  </View>
</Marker>
```

**Throne claiming logic:**
```typescript
async function claimThrone(throneId: string, sessionId: string) {
  // 1. Verify user is within 50m of throne GPS coords
  const location = await Location.getCurrentPositionAsync()
  const distance = calculateDistance(location, throne.coords)
  if (distance > 50) throw new Error('Not close enough to claim this throne')

  // 2. Verify session weight > current king weight
  if (session.weight_delta_lbs <= throne.current_king_weight_lbs) {
    throw new Error('Your session weight doesn\'t beat the current king')
  }

  // 3. Update throne in Supabase
  await supabase.from('thrones').update({
    current_king_id: userId,
    current_king_weight_lbs: session.weight_delta_lbs,
    current_king_session_id: sessionId,
  }).eq('id', throneId)

  // 4. Notify deposed king
  await notifyUser(throne.current_king_id, 'throne_lost', { location: throne.name })

  // 5. Notify all friends of claiming user
  await notifyFriends('throne_claimed', { location: throne.name, weight: session.weight_delta_lbs })

  // 6. Haptics — double pulse
  await Haptics.impactAsync(ImpactFeedbackStyle.Heavy)
  await new Promise(r => setTimeout(r, 150))
  await Haptics.impactAsync(ImpactFeedbackStyle.Heavy)
}
```

**Bottom sheet:**
- Uses `@gorhom/bottom-sheet`
- Shows throne list sorted by: mine first, then by distance
- Each throne row: name, current king, king's weight, distance from user
- Tap → throne detail with "Challenge" button
- "Register New Throne" button at bottom → name a location as a new throne

**Verify:** Map shows pins. GPS check works. Claiming updates leaderboard. Notifications fire.

---

## PHASE 9 — ACHIEVEMENTS SYSTEM
### Agent prompt: "Build the complete U·Dump achievements system"

**Achievement checking (runs after every session):**
```typescript
// lib/utils/checkAchievements.ts

async function checkAndUnlockAchievements(session: DumpSession, userStats: UserStats) {
  const toUnlock: string[] = []

  // FIRST_BLOOD — first ever session
  if (userStats.totalSessions === 1) toUnlock.push('FIRST_BLOOD')

  // Weight clubs
  if (session.weight_delta_lbs >= 1) toUnlock.push('POUND_CLUB')
  if (session.weight_delta_lbs >= 2) toUnlock.push('TWO_POUND_CLUB')
  if (session.weight_delta_lbs >= 3) toUnlock.push('THREE_POUND_CLUB')
  if (session.weight_delta_lbs >= 4) toUnlock.push('NICK_TERRITORY')

  // Time achievements
  const mins = session.duration_seconds / 60
  if (mins >= 60) toUnlock.push('HOUR_CLUB')
  if (mins >= 120) toUnlock.push('TWO_HOURS')

  // Speed run: < 5 min and > 1 lb
  if (mins < 5 && session.weight_delta_lbs >= 1) toUnlock.push('SPEED_RUN')

  // Streak milestones
  if (userStats.streakDays >= 7) toUnlock.push('STREAK_7')
  if (userStats.streakDays >= 30) toUnlock.push('STREAK_30')

  // Throne achievements
  if (session.throne_claimed) toUnlock.push('THRONE_CLAIMED')

  // BOBBY_MOMENT: got dethroned on home throne
  // Checked separately when throne update happens

  // Time of day
  const hour = new Date(session.started_at).getHours()
  if (hour < 7) toUnlock.push('MORNING_PERSON')
  if (hour >= 0 && hour < 4) toUnlock.push('MIDNIGHT_THRONE')

  // Total sessions milestones
  if (userStats.totalSessions >= 100) toUnlock.push('DUMPOLOGIST')

  // Filter out already-unlocked
  const alreadyUnlocked = await getUnlockedAchievements(userId)
  const newUnlocks = toUnlock.filter(k => !alreadyUnlocked.includes(k))

  // Save to Supabase
  for (const key of newUnlocks) {
    await supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_key: key,
      session_id: session.id,
    })
  }

  return newUnlocks // returned to show unlock animations
}
```

**Achievements screen:**
```
[Header]
  "ACHIEVEMENTS"
  "12 / 20 unlocked"

[Tier filter chips]
  All | Bronze | Silver | Gold | Platinum

[Grid — 2 columns]
  Each card:
    - Unlocked: full color, icon, title, description, unlock date
    - Locked (known): dim, icon, title, "???" description
    - Locked (secret): dim, "🔒" icon, "???" title, "???" description

[Recent Unlocks at top]
  Horizontal scroll of recently earned achievements
```

**Achievement card tiers:**
```
Bronze:   #CD7F32 — most common, participation
Silver:   #C0C0C0 — requires effort
Gold:     #D4AF37 — requires serious commitment  
Platinum: #64B4FF — ultra rare
```

**Verify:** All 20 achievements check correctly. Unlock animation fires. Secret achievements stay hidden.

---

## PHASE 10 — DUMP SCORE™ ANALYTICS
### Agent prompt: "Build the Dump Score analytics screen"

**Score calculation:** Use algorithm from BUILD_SPEC.md verbatim.

**Analytics screen sections:**
1. Large circular score ring (SVG arc, animated on mount)
2. Score trend line chart (victory-native, 30 days)
3. Factor breakdown (4 glass cards, progress bars)
4. AI insight card (deterministic based on score range — no actual AI needed)
5. Session log (FlatList, all historical sessions)

**Score ring animation:**
```typescript
const animatedScore = useSharedValue(0)

useEffect(() => {
  animatedScore.value = withTiming(dumpScore / 10, { duration: 1200 })
}, [dumpScore])

// SVG arc: stroke-dasharray calculated from animatedScore
// Full circle circumference = 2π × r
// Filled portion = circumference × (score / 10)
```

**Factor breakdown bars:**
```
Consistency:     [████████░░] 8.1  "14/30 days this month"
Weight Trend:    [███████░░░] 7.4  "Avg 2.2 lbs per session"
Session Length:  [█████░░░░░] 5.2  "Avg 42 min — slightly long"
Throne Activity: [██████████] 9.8  "King status: Active (3 thrones)"
```

**Insights (deterministic copy based on score):**
```typescript
// Score 9.5+: "You have achieved something no one asked you to achieve. We are proud."
// Score 8.0-9.4: "Elite performance. Your consistency speaks for itself."
// Score 6.0-7.9: "Solid numbers. There is room for improvement."
// Score 4.0-5.9: "Below average. This is not an accusation. It is a data point."
// Score <4.0: "Your Dump Score™ requires immediate attention. Please take this seriously."
```

**Verify:** Score renders, animates, factors display correctly.

---

## PHASE 11 — PUSH NOTIFICATIONS
### Agent prompt: "Implement the complete U·Dump push notification system"

**Expo push token registration:**
```typescript
// On app launch, after auth:
async function registerForPushNotifications(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID,
  })).data

  // Save token to user profile
  await supabase.from('profiles')
    .update({ push_token: token })
    .eq('id', userId)
}
```

**Add `push_token` column to profiles:**
```sql
alter table profiles add column push_token text;
```

**Supabase Edge Function — send notification:**
The function (from Phase 2) sends to Expo's push API.

**Trigger notifications from app:**
```typescript
// lib/utils/notifications.ts
export async function notifyFriends(type: NotificationType, payload: object) {
  // 1. Fetch all accepted friends' push tokens
  const { data: friends } = await supabase
    .from('friendships')
    .select('friend:profiles!friend_id(push_token, id)')
    .eq('user_id', currentUserId)
    .eq('status', 'accepted')

  // 2. Build notification content
  const { title, body } = buildNotificationContent(type, payload)

  // 3. Call Edge Function for each friend with a token
  for (const friend of friends) {
    if (!friend.push_token) continue
    await supabase.functions.invoke('send-notification', {
      body: { to: friend.push_token, title, body, data: payload }
    })

    // 4. Log to notification_events table
    await supabase.from('notification_events').insert({
      from_user_id: currentUserId,
      to_user_id: friend.id,
      type,
      payload,
    })
  }
}
```

**All 7 notification types must fire correctly:**
- `record_broken` — when session ends with new personal record
- `throne_claimed` — when throne claiming confirmed
- `throne_lost` — sent to deposed king when throne is taken
- `overstay_60` — 60 min timer fires in active session
- `overstay_120` — 120 min timer fires
- `friend_active` — optional: notify friends when someone starts a session
- `streak_milestone` — 7, 30, 100 day streaks

**Overstay cron (Supabase pg_cron):**
```sql
-- Run this in Supabase SQL editor to schedule overstay checks
select cron.schedule(
  'check-overstays',
  '*/5 * * * *',  -- every 5 minutes
  $$
  select net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/check-overstay',
    headers := '{"Authorization": "Bearer [service_role_key]"}'::jsonb
  )
  $$
);
```

**Verify:** All 7 notification types send and appear on device. Overstay fires at 60min. Deep link from notification opens correct screen.

---

## PHASE 12 — PROFILE + SETTINGS
### Agent prompt: "Build the U·Dump profile screen and settings"

**Profile screen:**
```
[Avatar — 80px circle, tap to change]
[Display name + username]
[Dump Score™ large — gold]
["Top N% globally" — caption]

[Stats row]
  Total sessions | All-time lbs | Thrones held | Friends

[Achievements preview]
  "12 / 20 unlocked" + horizontal scroll of earned badges
  [See All →]

[Recent sessions — 5 most recent]

[Settings section]
  Notifications (toggle each type)
  Privacy (who can see my sessions)
  Throne name (rename home throne)
  Add friends (search by username)
  
[Sign out]
```

**Friends management:**
```
Search by username → send friend request
Pending requests → accept/decline
Friends list with their stats
```

**Add `push_token`, `expo_push_token` and notification preferences:**
```sql
alter table profiles add column notification_prefs jsonb default '{
  "record_broken": true,
  "throne_claimed": true,
  "throne_lost": true,
  "overstay_60": true,
  "friend_active": false
}'::jsonb;
```

**Verify:** Profile loads. Avatar upload works. Friends can be added. Notifications toggle.

---

## PHASE 13 — POLISH + ANIMATIONS
### Agent prompt: "Polish all animations, transitions, and micro-interactions in U·Dump"

**Required animations:**
```
Home screen:
  - Stats cards fade in with staggered delay (0ms, 100ms, 200ms)
  - START button pulse (opacity + shadow, 2s loop)
  - Greeting text fade in on mount

Active session:
  - Timer pulse (opacity 1.0 → 0.85, 2s)
  - Sonar rings expanding (scale + opacity, 4s loop)
  - Status chip slide in when it appears

Results screen:
  - Crown drops in with spring (from y: -40, spring config: damping 10)
  - Gold particle bloom (12 tiny dots radiate and fade, 800ms)
  - Weight number counts up from 0 (600ms)
  - Result card slides up (from y: 60, 400ms)

Social feed:
  - New items slide in from top (FlatList prepend animation)
  - Alert items shake subtly on appear (small horizontal oscillation)

Tab bar:
  - Active tab icon bounces (scale 1.0 → 1.15 → 1.0, spring)

Achievements:
  - Unlock overlay slides up from bottom (spring)
  - Achievement card sparkle effect (3 tiny stars, 400ms)

Throne map:
  - Pins drop in with spring on map load
  - Bottom sheet has spring resistance
```

**Shared element transitions:**
- Session card on home → session detail (not strictly required for MVP but nice)

**Loading states:**
- Skeleton loaders (gray shimmer) for all data-fetching states
- No spinners. Skeletons only.

**Error states:**
- Network error: "Couldn't load your data. The throne awaits regardless."
- Empty states have personality: "No sessions yet. The throne is waiting."

**Verify:** App feels smooth. No janky transitions. Animations don't overlap or conflict.

---

## PHASE 14 — TESTFLIGHT SUBMISSION
### Do this yourself + agent assists with config

**Step 1: Final config check**
```bash
# Verify bundle ID matches Apple Developer account
# Verify version number: 1.0.0 (build 1)
# Verify all permissions strings are in app.json
# Verify no dev-only code or console.logs in production paths
```

**Step 2: EAS Build**
```bash
# First: make sure you're logged in
eas login

# Build for iOS internal distribution (TestFlight)
eas build --platform ios --profile preview

# This takes ~15-20 minutes
# EAS handles signing automatically if you've set up credentials
# Follow prompts for Apple credentials if first time
```

**Step 3: EAS Submit (to TestFlight)**
```bash
# After build completes:
eas submit --platform ios --latest

# Or submit a specific build:
eas submit --platform ios --id [build-id]
```

**Step 4: App Store Connect**
1. Go to appstoreconnect.apple.com
2. Find your build under TestFlight tab (takes ~15 min to process)
3. Add internal testers: Aaron, Shelden, Nick, Bobby, Jake, Garret
4. Each tester gets email invite → installs TestFlight app → installs U·Dump

**Step 5: Supabase production check**
```
□ All RLS policies enabled
□ All Edge Functions deployed
□ pg_cron overstay check running
□ Realtime enabled on correct tables
□ Storage bucket set to public
□ All env vars set in EAS secrets (not just .env.local)
```

**Set EAS secrets:**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --scope project --name EXPO_PUBLIC_EXPO_PROJECT_ID --value "xxx-xxx"
```

**Step 6: First launch checklist (on your own device)**
```
□ App installs from TestFlight
□ Onboarding flows through all 3 panels
□ Can create account
□ Can start + end a session
□ Results screen shows correctly
□ Can add friends (add Shelden/Nick as test friends)
□ Friend session appears in feed
□ Push notification arrives on friend's device
□ Throne map loads with pins
□ Achievements unlock screen fires
□ Leaderboard shows all testers
□ Bobby is last
```

---

## PHASE 15 — TESTER ONBOARDING
### What to send your TestFlight testers

**Group text / message to send:**
> "U·Dump is live on TestFlight. Check your email for the invite. Download TestFlight first if you don't have it. Create your account, add each other as friends (username is just your first name). Go dump somewhere. The leaderboard is real. Bobby, your throne has already been registered."

**Seed data to set up before inviting:**
1. Create Bobby's account first → his home throne gets registered as "Bobby's Throne"
2. Have Aaron log a session at Bobby's location → throne auto-claims
3. Bobby gets notification: "YOUR THRONE HAS FALLEN"
4. Bobby opens app to find himself last on the leaderboard

This is the prank. It executes itself.

---

## QUICK REFERENCE — AGENT PROMPTS

Copy-paste these into Claude Code at the start of each phase:

**Phase 1:** "Read UDUMP_BUILD_SPEC.md and UDUMP_ROADMAP.md. Scaffold the U·Dump Expo TypeScript project with the exact dependencies listed. Create the folder structure, install packages, configure app.json and eas.json as specified. Do not create any screens yet."

**Phase 2:** "Read UDUMP_BUILD_SPEC.md. Set up the Supabase backend: run the complete SQL schema, create the seed data, set up storage, enable realtime on the correct tables, and create all 4 Edge Functions."

**Phase 3:** "Read UDUMP_BUILD_SPEC.md and UDUMP_ROADMAP.md Phase 3. Build the complete auth flow: welcome onboarding (3 panels), login screen, signup screen, username picker, and throne name screen. Wire up Supabase auth with SecureStore persistence."

**Phase 4:** "Read UDUMP_BUILD_SPEC.md Phase 4. Build the custom tab bar and home screen exactly as specified. Use GlassCard, GoldButton, and the design system from constants/. Fetch real data from Supabase."

**Phase 5:** "Read UDUMP_BUILD_SPEC.md Phase 5. Build the active session screen and results screen (all 3 states). Implement the complete session end logic: save to Supabase, check personal record, check throne, update Dump Score, check achievements, send notifications, navigate to results."

**Phase 6:** "Read UDUMP_BUILD_SPEC.md Phase 6. Build the social feed with realtime Supabase subscription. Implement all 4 FeedItem variants especially the overstay alert with quick reply chips."

**Phase 7:** "Read UDUMP_BUILD_SPEC.md Phase 7. Build the leaderboard with friends and global tabs. Bobby should always be last (his seed data ensures this). Implement rank 1/2/3 crown/silver/bronze treatment."

**Phase 8:** "Read UDUMP_BUILD_SPEC.md Phase 8. Build the throne map with react-native-maps, custom SVG pins, and the complete throne claiming logic with GPS distance check."

**Phase 9:** "Read UDUMP_BUILD_SPEC.md Phase 9. Implement all 20 achievements from constants/achievements.ts. Wire up checkAndUnlockAchievements to run after every session end. Build the achievements screen with tier filters and the unlock animation overlay."

**Phase 10:** "Read UDUMP_BUILD_SPEC.md Phase 10. Build the Dump Score analytics screen with the animated ring, factor breakdown, victory-native chart, and deterministic insight copy."

**Phase 11:** "Read UDUMP_BUILD_SPEC.md Phase 11. Implement all 7 push notification types using Expo push tokens and Supabase Edge Functions. Set up the overstay pg_cron job."

**Phase 12:** "Read UDUMP_BUILD_SPEC.md Phase 12. Build the profile screen with avatar upload, stats, achievements preview, and friends management."

**Phase 13:** "Read UDUMP_BUILD_SPEC.md Phase 13. Polish all animations using react-native-reanimated. Implement every animation listed: home stagger, session pulse, results spring, achievement unlock overlay, tab bar bounce. Add skeleton loaders and personality-driven empty/error states."

**Phase 14:** "Help me prepare for TestFlight submission. Check app.json config, verify EAS setup, set production secrets, and walk me through the eas build and eas submit commands."

---

## TIMELINE ESTIMATE

| Phase | Est. Time | Notes |
|-------|-----------|-------|
| 0 — Setup | 2-4 hrs | Manual: Apple, Supabase, Expo accounts |
| 1 — Scaffold | 30 min | Agent |
| 2 — Backend | 45 min | Agent + manual Supabase clicks |
| 3 — Auth | 45 min | Agent |
| 4 — Home | 1 hr | Agent |
| 5 — Sessions | 1.5 hrs | Agent — most complex feature |
| 6 — Social | 1 hr | Agent |
| 7 — Leaderboard | 30 min | Agent |
| 8 — Throne Map | 1 hr | Agent |
| 9 — Achievements | 45 min | Agent |
| 10 — Analytics | 45 min | Agent |
| 11 — Notifications | 1 hr | Agent + Supabase config |
| 12 — Profile | 45 min | Agent |
| 13 — Polish | 1 hr | Agent |
| 14 — TestFlight | 1-2 hrs | Manual + EAS build wait |

**Total: ~1-2 focused days with agents running in parallel**

EAS build takes 15-20 min. TestFlight processing takes 15-30 min. Plan accordingly.

---

## KNOWN GOTCHAS

1. **react-native-maps on iOS requires Google Maps API key** OR use Apple Maps (default, no key needed). Use Apple Maps for MVP.

2. **BLE (react-native-ble-plx) requires a physical device** — cannot test on simulator. Keep BLE in a conditional that gracefully falls back to manual entry if no device found.

3. **Push notifications don't work in Expo Go** — must use development build. Phase 1 should build a dev client: `eas build --profile development`

4. **Supabase realtime has connection limits on free tier** — upgrade to Pro ($25/mo) before inviting all testers.

5. **Location permissions on iOS** — `NSLocationWhenInUseUsageDescription` must be in app.json infoPlist. Without it, App Store review will reject.

6. **expo-blur performance** — on older devices, too many BlurViews hurt FPS. Cap at 3-4 BlurViews on any single screen.

7. **EAS first build** — takes longer (~25 min) as it builds the entire native layer. Subsequent builds are faster.

8. **Bobby's account** — create it first, set his Dump Score to 3.1 in seed data. When testers join, the leaderboard humiliation is automatic.

---

*U·Dump Inc. — A to Z. Real app. Real TestFlight. Real leaderboard.*
*Bobby will be last. This has been engineered into the data model.*
*👑*
