# U·DUMP — Claude Code Build Specification
### Hand this file to Claude Code. It has everything it needs.

---

## WHAT WE'RE BUILDING

A React Native / Expo app called **U·Dump** — a luxury competitive toilet analytics app.

The joke is that it's treated with complete seriousness. Dead serious health app UX. The comedy is purely in the subject matter. Do not wink at the camera in the UI copy.

---

## STACK

- **Framework:** React Native + Expo (SDK 51+)
- **Language:** TypeScript (strict)
- **Backend:** Supabase (auth, database, storage, realtime, push via Edge Functions)
- **Navigation:** Expo Router (file-based)
- **State:** Zustand
- **Styling:** StyleSheet + custom design system (no NativeWind)
- **Animations:** React Native Reanimated 3
- **BLE:** react-native-ble-plx (hardware integration, Phase 2)
- **Maps:** react-native-maps (throne map)
- **Push:** Expo Notifications + Supabase Edge Functions
- **Charts:** victory-native
- **Haptics:** expo-haptics

---

## DESIGN SYSTEM

### Colors
```typescript
export const Colors = {
  void: '#06060A',
  base: '#0C0C12',
  surface: '#131318',
  elevated: '#1A1A22',

  glass1: 'rgba(255,255,255,0.03)',
  glass2: 'rgba(255,255,255,0.06)',
  glass3: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderHi: 'rgba(255,255,255,0.14)',

  gold: '#D4AF37',
  goldBright: '#F0CE60',
  goldDim: 'rgba(212,175,55,0.18)',
  goldGlow: 'rgba(212,175,55,0.08)',

  red: '#FF3B30',
  green: '#30D158',
  blue: '#0A84FF',

  text1: '#FFFFFF',
  text2: 'rgba(255,255,255,0.58)',
  text3: 'rgba(255,255,255,0.28)',
  textGold: '#D4AF37',
}
```

### Typography
```typescript
export const Type = {
  display:     { fontFamily: 'System', fontWeight: '700' as const, letterSpacing: -0.5 },
  displayLight:{ fontFamily: 'System', fontWeight: '300' as const, letterSpacing: -0.5 },
  mono:        { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  label:       { fontFamily: 'System', fontWeight: '500' as const, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  body:        { fontFamily: 'System', fontWeight: '400' as const, fontSize: 15, lineHeight: 22 },
  caption:     { fontFamily: 'System', fontWeight: '400' as const, fontSize: 12, lineHeight: 18 },
}
```

### Glass Card Component
```tsx
import { BlurView } from 'expo-blur';

export const GlassCard = ({ children, style, intensity = 20 }) => (
  <BlurView
    intensity={intensity}
    tint="dark"
    style={[{
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    }, style]}
  >
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.04)',
      flex: 1,
    }}>
      {children}
    </View>
  </BlurView>
);
```

### Gold Button
```tsx
export const GoldButton = ({ label, onPress, size = 'lg' }) => (
  <LinearGradient
    colors={['#C9A030', '#F0CE60']}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={{
      borderRadius: 14,
      height: size === 'lg' ? 56 : 44,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#D4AF37',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
    }}
  >
    <TouchableOpacity onPress={onPress} style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#000', fontWeight: '800', fontSize: size === 'lg' ? 17 : 15, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </TouchableOpacity>
  </LinearGradient>
);
```

---

## FILE STRUCTURE

```
app/
  (auth)/
    welcome.tsx          ← splash + onboarding entry
    login.tsx
    signup.tsx
  (tabs)/
    index.tsx            ← Home / Dashboard
    activity.tsx         ← My Activity + Dump Score™
    social.tsx           ← News Feed
    thrones.tsx          ← Throne Map
  session/
    active.tsx           ← Live session screen
    results.tsx          ← Post-session results
  profile/
    index.tsx
    achievements.tsx
  _layout.tsx
  +not-found.tsx

components/
  ui/
    GlassCard.tsx
    GoldButton.tsx
    StatCard.tsx
    Avatar.tsx
    Badge.tsx
    TabBar.tsx           ← Custom tab bar
  session/
    SessionTimer.tsx
    WeightRings.tsx      ← Apple Watch-style rings
    StartButton.tsx
  social/
    FeedItem.tsx
    NotificationCard.tsx
  throne/
    ThronePin.tsx
    ThroneCard.tsx
  achievements/
    AchievementBadge.tsx
    FirstBloodBadge.tsx

lib/
  supabase.ts
  store/
    session.store.ts
    user.store.ts
    social.store.ts
  hooks/
    useSession.ts
    useLeaderboard.ts
    useFriends.ts
    useThrones.ts
  utils/
    dumpScore.ts         ← Dump Score™ calculation
    notifications.ts
    ble.ts               ← Bluetooth (Phase 2)

constants/
  colors.ts
  typography.ts
  achievements.ts        ← All achievement definitions
```

---

## SUPABASE SCHEMA

```sql
-- Run in Supabase SQL editor

-- USERS (extends auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  dump_score numeric(4,1) default 0,
  streak_days integer default 0,
  last_session_at timestamptz,
  total_sessions integer default 0,
  total_weight_lbs numeric(8,2) default 0,
  created_at timestamptz default now()
);

-- SESSIONS
create table public.dump_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  throne_id uuid references thrones(id),        -- null = home throne
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  weight_before_lbs numeric(5,2),
  weight_after_lbs numeric(5,2),
  weight_delta_lbs numeric(5,2),
  is_personal_record boolean default false,
  throne_claimed boolean default false,
  dump_score_snapshot numeric(4,1),
  created_at timestamptz default now()
);

-- THRONES (GPS locations)
create table public.thrones (
  id uuid primary key default gen_random_uuid(),
  name text not null,                           -- "Bobby's Throne"
  owner_user_id uuid references profiles(id),   -- who registered it
  current_king_id uuid references profiles(id),
  current_king_weight_lbs numeric(5,2),
  current_king_session_id uuid references dump_sessions(id),
  lat numeric(10,7),
  lng numeric(10,7),
  is_home boolean default false,
  created_at timestamptz default now()
);

-- FRIENDSHIPS
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending','accepted','blocked')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- ACHIEVEMENTS
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  achievement_key text not null,               -- 'FIRST_BLOOD', 'THRONE_CLAIMED', etc.
  unlocked_at timestamptz default now(),
  session_id uuid references dump_sessions(id),
  unique(user_id, achievement_key)
);

-- NOTIFICATION EVENTS
create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  type text check (type in (
    'record_broken',
    'throne_claimed',
    'throne_lost',
    'overstay_60',
    'overstay_120',
    'friend_active',
    'streak_milestone',
    'achievement_unlocked'
  )),
  session_id uuid references dump_sessions(id),
  throne_id uuid references thrones(id),
  payload jsonb,
  sent_at timestamptz default now(),
  read_at timestamptz
);

-- RLS POLICIES (enable row level security on all tables)
alter table profiles enable row level security;
alter table dump_sessions enable row level security;
alter table thrones enable row level security;
alter table friendships enable row level security;
alter table user_achievements enable row level security;
alter table notification_events enable row level security;

-- profiles: readable by all authenticated, writable by owner
create policy "profiles_read" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_write" on profiles for all using (auth.uid() = id);

-- sessions: readable by friends, writable by owner
create policy "sessions_read" on dump_sessions for select using (
  user_id = auth.uid() or
  exists (select 1 from friendships where user_id = auth.uid() and friend_id = dump_sessions.user_id and status = 'accepted')
);
create policy "sessions_write" on dump_sessions for all using (user_id = auth.uid());

-- thrones: readable by all authenticated
create policy "thrones_read" on thrones for select using (auth.role() = 'authenticated');
create policy "thrones_write" on thrones for all using (owner_user_id = auth.uid());
```

---

## SCREEN SPECIFICATIONS

### 1. HOME SCREEN (`app/(tabs)/index.tsx`)

**Layout (top to bottom):**
```
StatusBar (transparent)

[Greeting Row]
  "GOOD MORNING" (label, 10px, uppercase, text3)
  "Aaron." (display, 34px, bold, text1)
  "Dump Score™ 9.2 ↑" (mono, 12px, gold)

[START SESSION BUTTON]
  Full width, 66px tall, border-radius 18
  LinearGradient: #C49A20 → #F0CE60
  Left: green connection dot (if BLE connected) or gray (manual)
  Center: "BEGIN SESSION" (bold, 19px, black, uppercase)
  Sub: "Seat connected · Bluetooth" OR "Manual entry mode"
  Subtle shimmer overlay (top edge highlight via ::after equiv)

[Stats Row — horizontal ScrollView, 3 cards]
  Card: "TODAY" → dump count
  Card: "WEIGHT" → lbs today (gold)
  Card: "STREAK" → 🔥 N days

[Last Session Card — GlassCard]
  Header: "Last Session · 3:32 PM" + "👑 Record" badge (if applicable)
  Stats row: Duration (mono, 24px) + Weight delta (mono, 24px, gold)

[Recent Friends Activity — mini feed, 2-3 items]
  Compact FeedItem components
```

**Interactions:**
- START button → navigate to `session/active`
- Pull to refresh → refetch today's stats
- Tap last session → navigate to that session detail

---

### 2. ACTIVE SESSION (`app/session/active.tsx`)

**This is the hero screen. Must feel premium.**

**Layout:**
```
[Back/cancel — top left, ghost]

[Live Timer — CENTER, MASSIVE]
  Font: Menlo/monospace, 80px, white
  Format: 00:14:32
  Subtle opacity pulse animation (1.0 → 0.85, 2s, ease-in-out, loop)

[Weight Rings — below timer]
  Two concentric arcs (SVG or react-native-svg)
  Outer ring: time progress vs personal best (blue)
  Inner ring: estimated weight trend (gold)
  Center: crown icon (gold, glowing if on pace for record)

[Status Chip — below rings]
  GlassCard pill
  "⚡ On pace for a personal record" (green)
  OR "📍 At: Bobby's Throne" (gold)
  OR "🔴 LIVE · Friends can see this"

[Bottom area]
  Weight entry row (if manual: before/after input fields)
  OR BLE weight display (if hardware connected)

[END SESSION — bottom, GlassCard pill button]
  "END SESSION"
  Subtext: "Hold 2s to cancel without saving"

[Background]
  Very dark, barely visible slow-breathing radial gradient
  Expanding sonar rings from center (subtle, 4s loop)
```

**Logic:**
- Timer starts immediately on mount, stores `started_at`
- Every 60s: check if duration > 60min → trigger overstay notification to friends
- On END: navigate to `session/results` with session data
- Long press cancel (2s): go back without saving, haptic feedback

---

### 3. RESULTS SCREEN (`app/session/results.tsx`)

**Three states based on outcome:**

**STATE A — New Personal Record:**
```
[Gold particle bloom — subtle, behind everything]
Crown icon (48px, drops in with spring animation)
"NEW RECORD" (label, gold, letter-spaced)
"3.1" (mono, 96px, white, bold) — the weight
"POUNDS · 53 MINUTES" (mono, 12px, text3)

[Throne banner — if at a friend's location]
  Gold-bordered GlassCard
  "👑 New King: Bobby's Throne"
  "Bobby's record was 2.4 lbs · Dethroned"

[Stats breakdown GlassCard]
  Duration | Weight delta | Location

[Action buttons]
  Primary: "CLAIM THE THRONE" (gold, full width) — if applicable
  Secondary: "Share" | "Done"
```

**STATE B — Throne Claimed (no record):**
```
Same layout, header reads "👑 THRONE CLAIMED"
Show what notification Bobby just received
```

**STATE C — Standard session:**
```
Clean results, encouraging Dump Score™ update
"Solid consistency. Your streak continues."
```

**Haptics:**
- Record: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` — strong
- Throne claimed: double haptic pulse
- Standard: light impact

---

### 4. SOCIAL FEED (`app/(tabs)/social.tsx`)

**Layout:**
```
[Header]
  "Feed" (display, 28px)
  Bell icon (notifications)

[Filter chips — horizontal scroll]
  All | Records | Thrones | Alerts

[FeedItem list — FlatList]
  Type A: Regular session (avatar, name, time, stats)
  Type B: Record (gold border, 🏆 badge)
  Type C: Throne claimed (crown, gold glow)
  Type D: OVERSTAY ALERT (red border, red tint)
    - Shows: "🚨 [Name] has been on the toilet for [N] minutes"
    - Quick reply chips: "You okay?" | "Need help?" | "👑"
```

**FeedItem component:**
```tsx
// Type D (alert) special treatment:
<GlassCard style={{ borderColor: 'rgba(255,59,48,0.3)', backgroundColor: 'rgba(255,59,48,0.04)' }}>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Text style={{ fontSize: 16 }}>🚨</Text>
    <Text style={{ color: Colors.red, fontWeight: '600' }}>
      {name} has been on the toilet for {minutes} minutes
    </Text>
  </View>
  <Badge label="WELFARE CHECK RECOMMENDED" color="red" />
  <ReplyChips options={["You okay?", "Need help?", "👑"]} />
</GlassCard>
```

---

### 5. THRONE MAP (`app/(tabs)/thrones.tsx`)

**Layout:**
```
[MapView — fills full screen, dark map style]
  Custom map style: dark (Apple Maps dark style JSON)

[Floating header card — glass, top]
  "YOUR EMPIRE"
  "N Thrones held · N contested"

[Custom map pins]
  Gold crown pin = you hold this throne
  White pin = friend's throne you haven't conquered
  Red pin = someone took YOUR throne
  Tap pin → throne detail bottom sheet

[Bottom sheet — slides up, glass]
  "MY THRONE" section (gold header)
    King: [you] · Today 9:55 AM · Record: 4.1 lbs
  
  "KINGS OF THRONES" list
    📍 Bobby's Throne → King: Aaron · 3.1 lbs
    📍 Johnson's Throne → King: Shelden · 2.8 lbs
    📍 Nick's Throne → King: Nick · [contested]
```

**Throne pin press:**
- Opens bottom sheet with throne detail
- "Claim This Throne" button if you're currently there (GPS check within 50m)
- Shows all-time kings list

---

### 6. DUMP SCORE™ ANALYTICS (`app/(tabs)/activity.tsx`)

```
[Score header]
  "DUMP SCORE™" (label)
  "9.2" (mono, 64px, gold)
  "Top 8% globally" (caption, text3)

[Circular progress ring — large]
  0–10 scale, gold gradient arc
  Animated fill on mount

[Factor breakdown — 4 GlassCards in 2×2 grid]
  Consistency:      ████████░░  8.1
  Weight Trend:     ███████░░░  7.4
  Session Length:   █████░░░░░  5.2  ← "Spending too long on the throne"
  Throne Activity:  ██████████  9.8  ← "King status: Active"

[Weekly chart — victory-native LineChart]
  Gold line, 7 days
  Subtle gold fill below line

[Insight card — GlassCard]
  AI-generated insight text (from Dump Score algorithm)
  "Your best sessions happen Tuesday after 9am."
  (Copy is absurdly serious)

[Dump Log — FlatList]
  Each session: time | duration | weight | location
```

---

### 7. ACHIEVEMENTS SCREEN (`app/profile/achievements.tsx`)

**This section must be UNHINGED. Every achievement is a real video game achievement format.**

```typescript
// constants/achievements.ts
export const ACHIEVEMENTS = [
  {
    key: 'FIRST_BLOOD',
    title: 'First Blood',
    description: 'Complete your first logged session.',
    icon: '🩸',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'THRONE_CLAIMED',
    title: 'Throne Claimed',
    description: 'Claim your first throne away from home.',
    icon: '👑',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'DETHRONED',
    title: 'The Usurper',
    description: 'Take a throne from a friend. Friendship is secondary.',
    icon: '⚔️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'BOBBY_MOMENT',
    title: 'The Bobby',
    description: 'Get dethroned on your own home toilet.',
    icon: '😔',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'POUND_CLUB',
    title: '1 lb Club',
    description: 'Log a single session over 1 pound.',
    icon: '💪',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'TWO_POUND_CLUB',
    title: '2 lb Club',
    description: '2 lbs in a single session. We respect this.',
    icon: '🏋️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'THREE_POUND_CLUB',
    title: '3 lb Club',
    description: 'Three pounds. We don\'t have questions. We have concerns.',
    icon: '🤯',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'NICK_TERRITORY',
    title: 'Nick Territory',
    description: 'Log over 4 lbs in a single session. Nick set this record. Be Nick.',
    icon: '🏆',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'STREAK_7',
    title: 'Week Warrior',
    description: '7-day logging streak. Consistency is a lifestyle.',
    icon: '🔥',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'STREAK_30',
    title: 'Monthly Menace',
    description: '30-day logging streak. You need this more than we do.',
    icon: '📅',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'MEDICAL_HELP',
    title: 'Better Safe Than Sorry',
    description: 'Press the Medical Help button. We hope you\'re okay.',
    icon: '🚑',
    tier: 'bronze',
    secret: true,
  },
  {
    key: 'HOUR_CLUB',
    title: 'The Garret',
    description: 'Spend over 60 minutes in a single session. Your friends were notified.',
    icon: '⏱️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'TWO_HOURS',
    title: 'Emergency Protocol',
    description: '2 hours. Emergency contacts alerted. We\'re glad you survived.',
    icon: '🆘',
    tier: 'gold',
    secret: false,
  },
  {
    key: 'GLOBAL_RANK_1',
    title: 'Hall of Stench',
    description: 'Reach #1 on the global leaderboard. You have peaked as a human.',
    icon: '🌍',
    tier: 'platinum',
    secret: false,
  },
  {
    key: 'DUMPOLOGIST',
    title: 'Certified Dumpologist',
    description: 'Complete 100 logged sessions.',
    icon: '🎓',
    tier: 'platinum',
    secret: false,
  },
  {
    key: 'DUMP_SCORE_10',
    title: 'Perfect Form',
    description: 'Achieve a Dump Score™ of 10.0.',
    icon: '💎',
    tier: 'platinum',
    secret: true,
  },
  {
    key: 'TRAVEL_THRONE',
    title: 'Globetrotter',
    description: 'Claim a throne more than 100 miles from home.',
    icon: '✈️',
    tier: 'silver',
    secret: false,
  },
  {
    key: 'SPEED_RUN',
    title: 'Speedrunner',
    description: 'Complete a session in under 5 minutes with over 1 lb logged. Impressive.',
    icon: '⚡',
    tier: 'gold',
    secret: true,
  },
  {
    key: 'MORNING_PERSON',
    title: 'Morning Constitutional',
    description: 'Log a session before 7am. The early throne gets the crown.',
    icon: '🌅',
    tier: 'bronze',
    secret: false,
  },
  {
    key: 'MIDNIGHT_THRONE',
    title: 'Midnight Rider',
    description: 'Log a session after midnight. We have no comment.',
    icon: '🌙',
    tier: 'bronze',
    secret: true,
  },
]
```

**Achievement card UI:**
```tsx
// Tier colors
const TIER_COLORS = {
  bronze:   { bg: 'rgba(166,109,77,0.15)',  border: 'rgba(166,109,77,0.35)',  text: '#CD7F32' },
  silver:   { bg: 'rgba(168,168,168,0.12)', border: 'rgba(168,168,168,0.30)', text: '#C0C0C0' },
  gold:     { bg: 'rgba(212,175,55,0.15)',  border: 'rgba(212,175,55,0.35)',  text: '#D4AF37' },
  platinum: { bg: 'rgba(100,180,255,0.12)', border: 'rgba(100,180,255,0.30)', text: '#64B4FF' },
}

// Locked achievements show as dim + "???" if secret, or dim + title if not secret
// Unlocked achievements show full color + unlock date
```

---

### 8. ONBOARDING (`app/(auth)/welcome.tsx`)

**3 screens, swipeable:**

```
Screen 1: SPLASH
  U·DUMP wordmark (large, gold)
  "Originally conceived 2016."
  "Finally shipped 2026."
  "You're welcome."
  [Get Started button]

Screen 2: THE PITCH
  "Every room in the house has gone smart."
  "Every room except one."
  Animated toilet icon
  "Until now."

Screen 3: SETUP
  Username input
  Add friends (search by username)
  "Register Your Throne" (optional — name your home toilet)
  [Let's Go button → home]
```

---

## NOTIFICATION STRINGS (exact copy)

```typescript
export const NOTIFICATION_COPY = {
  record_broken: {
    title: 'NEW PERSONAL RECORD',
    body: (name: string, lbs: number) => `${name} — ${lbs} lbs. The people have been informed.`,
  },
  throne_claimed: {
    title: 'THRONE CLAIMED 👑',
    body: (name: string, location: string, lbs: number, mins: number) =>
      `${name} is now King of ${location}. ${lbs} lbs · ${mins} min`,
  },
  throne_lost: {
    title: 'YOUR THRONE HAS FALLEN',
    body: (friend: string, location: string) =>
      `${friend} dethroned you at ${location}. Reclaim it.`,
  },
  overstay_60: {
    title: 'HELP!',
    body: (name: string) => `${name} has exceeded 60 minutes on the toilet.`,
  },
  overstay_120: {
    title: 'MEDICAL ATTENTION MAY BE REQUIRED',
    body: (name: string) => `${name} has been on the toilet for 2 hours. Please respond.`,
  },
  friend_active: {
    title: (name: string) => `👑 ${name} is on the throne`,
    body: (location: string, mins: number) => `Live at ${location} · ${mins} min elapsed`,
  },
  streak_milestone: {
    title: (days: number) => `STREAK: ${days} DAYS`,
    body: () => `Consistency is the foundation of greatness.`,
  },
}
```

---

## DUMP SCORE™ ALGORITHM

```typescript
// lib/utils/dumpScore.ts

interface SessionHistory {
  sessions: DumpSession[]
  thrones: ThroneRecord[]
}

export function calculateDumpScore(history: SessionHistory): number {
  const { sessions, thrones } = history

  if (sessions.length === 0) return 0

  // Factor 1: Consistency (0-10)
  // How many of the last 30 days had a session?
  const last30 = sessions.filter(s => {
    const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000
    return daysAgo <= 30
  })
  const consistency = Math.min((last30.length / 30) * 10, 10)

  // Factor 2: Weight Trend (0-10)
  // Is their average weight per session improving?
  const recent = sessions.slice(0, 10)
  const avgWeight = recent.reduce((sum, s) => sum + (s.weight_delta_lbs || 0), 0) / recent.length
  const weightScore = Math.min(avgWeight * 2.5, 10) // 4 lbs = 10 points (Nick territory)

  // Factor 3: Session Length (0-10) — sweet spot is 10-30 min
  const avgDuration = recent.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / recent.length / 60
  const lengthScore = avgDuration < 5 ? avgDuration * 2
    : avgDuration <= 30 ? 10
    : avgDuration <= 60 ? Math.max(10 - (avgDuration - 30) * 0.2, 5)
    : 2 // Garret territory

  // Factor 4: Throne Activity (0-10)
  const thronesClaimed = thrones.filter(t => t.current_king_id === 'me').length
  const throneScore = Math.min(thronesClaimed * 2, 10)

  // Weighted average
  const score = (
    consistency    * 0.30 +
    weightScore    * 0.35 +
    lengthScore    * 0.15 +
    throneScore    * 0.20
  )

  return Math.round(score * 10) / 10 // one decimal place
}

export function getDumpScoreInsight(score: number, history: SessionHistory): string {
  if (score >= 9.5) return "You have achieved something no one asked you to achieve. We are proud."
  if (score >= 8.0) return "Elite performance. Your consistency speaks for itself."
  if (score >= 6.0) return "Solid numbers. There is room for improvement. You know what to do."
  if (score >= 4.0) return "Below average. This is not an accusation. It is a data point."
  return "Your Dump Score™ requires immediate attention. Please take this seriously."
}
```

---

## PHASE 1 MVP (build in this order)

1. **Auth flow** — signup, login, profile creation
2. **Home screen** — greeting, start button, stats cards, last session
3. **Active session** — timer, manual weight entry, end session
4. **Results screen** — all three states (record / throne / standard)
5. **Social feed** — friend activity, overstay alerts
6. **Leaderboard** — friends tab + global tab
7. **Achievements** — unlock system, display grid
8. **Push notifications** — all 7 notification types via Supabase Edge Functions

## PHASE 2

9. **Throne Map** — GPS, custom pins, claiming logic
10. **Dump Score™ Analytics** — full analytics screen, charts
11. **BLE Hardware** — react-native-ble-plx integration with sensor ring
12. **DumpMind™ AI** — AI coaching feedback (Pro tier)
13. **U·Throne Pro** — bidet upgrade in-app upsell

---

## IMPORTANT NOTES FOR CLAUDE CODE

- This is the same Expo + Supabase stack as Animi. Patterns from that project apply.
- Use `expo-blur` BlurView for ALL glass card effects. This is non-negotiable for the aesthetic.
- Prefer `react-native-reanimated` for all animations. No basic `Animated` API.
- `expo-haptics` on every significant interaction: session start, record broken, throne claimed.
- The START SESSION button needs a pulse animation (opacity/shadow, 2s loop) when a BLE device is connected.
- All data/stats text uses the mono font (`Menlo` on iOS, `monospace` on Android).
- Bobby is always last on the leaderboard in any demo/seed data.
- "Equity: Pending Review" is Nick's role. Do not change this.
- The app never uses the 💩 emoji anywhere in the UI. It's beneath the brand.

---

*U·Dump Inc. — Built without asking permission. 👑*
*Aaron, Shelden & Nick — Co-Founders*
*Bobby — Original Visionary (user account, not equity)*
