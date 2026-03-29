# U-DUMP UI OVERHAUL — Paperclip Agent Spec

## CONTEXT

The app is ~85% feature-complete but the visual quality is unacceptable. The code works but the UI looks like a prototype, not a luxury product. This spec covers every fix needed to make it look premium.

**The golden rule:** This app must look like Apple Health meets a luxury watch brand. Dead serious. No cheap-looking gradients, no generic emoji-driven UI, no "mobile dev tutorial" energy. Every pixel should feel intentional.

**Reference apps for visual quality:** Apple Health, Oura Ring, Whoop, Arc browser. Dark, minimal, premium typography, breathing room.

---

## PRIORITY 1: DESIGN SYSTEM FIXES

These are foundational problems that affect every screen. Fix these FIRST before touching any screens.

### 1A. Typography — Load Custom Fonts

**Problem:** The app uses `fontFamily: 'System'` everywhere. The BUILD_SPEC calls for Barlow Condensed (display), Barlow (body), and DM Mono (data/numbers). System font makes everything look generic.

**Fix in `constants/typography.ts`:**
```typescript
import { Platform } from 'react-native';

export const Fonts = {
  displayFamily: 'BarlowCondensed-Bold',
  displayLightFamily: 'BarlowCondensed-Light',
  bodyFamily: 'Barlow-Regular',
  bodyMediumFamily: 'Barlow-Medium',
  bodySemiBoldFamily: 'Barlow-SemiBold',
  monoFamily: 'DMMono-Regular',
  monoMediumFamily: 'DMMono-Medium',
} as const;

export const Type = {
  display: {
    fontFamily: Fonts.displayFamily,
    letterSpacing: -0.5,
  },
  displayLight: {
    fontFamily: Fonts.displayLightFamily,
    letterSpacing: -0.5,
  },
  mono: {
    fontFamily: Fonts.monoFamily,
  },
  monoMedium: {
    fontFamily: Fonts.monoMediumFamily,
  },
  label: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 12,
    lineHeight: 18,
  },
} as const;
```

**Font loading in `app/_layout.tsx`:**
```typescript
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'BarlowCondensed-Bold': require('../assets/fonts/BarlowCondensed-Bold.ttf'),
  'BarlowCondensed-Light': require('../assets/fonts/BarlowCondensed-Light.ttf'),
  'BarlowCondensed-SemiBold': require('../assets/fonts/BarlowCondensed-SemiBold.ttf'),
  'Barlow-Regular': require('../assets/fonts/Barlow-Regular.ttf'),
  'Barlow-Medium': require('../assets/fonts/Barlow-Medium.ttf'),
  'Barlow-SemiBold': require('../assets/fonts/Barlow-SemiBold.ttf'),
  'DMMono-Regular': require('../assets/fonts/DMMono-Regular.ttf'),
  'DMMono-Medium': require('../assets/fonts/DMMono-Medium.ttf'),
});

// Show splash until fonts load
if (!fontsLoaded) return null;
```

**Action:** Download all font files from Google Fonts and place in `assets/fonts/`. Then update every `fontWeight` usage — with custom fonts, weight is encoded in the font file name, not the style prop.

### 1B. Colors — Increase Contrast

**Problem:** `text2` at 0.58 opacity and `text3` at 0.28 opacity are too dim. Body text is hard to read.

**Fix in `constants/colors.ts`:**
```typescript
text2: 'rgba(255,255,255,0.72)',  // was 0.58
text3: 'rgba(255,255,255,0.42)',  // was 0.28
glassBorder: 'rgba(255,255,255,0.10)',   // was 0.08
glassBorderHi: 'rgba(255,255,255,0.18)', // was 0.14
```

### 1C. GlassCard — Add Inner Gradient

**Problem:** Current GlassCard is just a blur with a flat overlay. Looks cheap. Needs a subtle top-to-bottom gradient for depth.

**Fix in `components/ui/GlassCard.tsx`:**
```tsx
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  innerStyle?: ViewStyle;
  gold?: boolean; // gold border for records/thrones
}

export function GlassCard({ children, style, intensity = 20, innerStyle, gold }: GlassCardProps) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.card, gold && styles.goldBorder, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  goldBorder: {
    borderColor: Colors.goldDim,
  },
  inner: {
    flex: 1,
  },
});
```

### 1D. GoldButton — Use Barlow Condensed + Better Gradient

**Problem:** Button text uses system font. Gold gradient start color (#C9A030) is too muddy.

**Fix in `components/ui/GoldButton.tsx`:**
Change gradient colors from `['#C9A030', '#F0CE60']` to `['#D4AF37', '#F0CE60']` (matches the design system gold).
Change label fontFamily to `Fonts.displayFamily` (BarlowCondensed-Bold).
Add `textTransform: 'uppercase'` and `letterSpacing: 1.5` to the label.

---

## PRIORITY 2: TAB BAR

### 2A. Replace Emoji Icons with Custom Tab Bar

**Problem:** The tab bar uses emoji (🏠📊📣👑) which look different on every device and feel cheap. The BUILD_SPEC calls for a custom tab bar with proper icons.

**Fix:** Replace emoji with either:
- SF Symbols via `@expo/vector-icons` (Ionicons set), OR
- Simple custom SVG icons

**Tab icons should be:**
- Home: `crown-outline` / `crown` (filled when active) — this is a throne app, crown is the brand
- Score: `analytics-outline` / `analytics`
- Feed: `people-outline` / `people`
- Thrones: `location-outline` / `location`

**Active state:** Gold color + filled icon variant. NOT just opacity change.
**Inactive state:** `Colors.text3` + outline icon variant.
**Active indicator:** Small 4px gold dot below the icon (not the label).

**Updated tab bar label style:**
```typescript
tabLabel: {
  fontFamily: 'BarlowCondensed-SemiBold',
  fontSize: 9,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
}
```

---

## PRIORITY 3: HOME SCREEN (`app/(tabs)/index.tsx`)

### 3A. Greeting Section

**Current:** Generic system font, cramped spacing.

**Fix:**
- "GOOD MORNING" label: Use `Type.label` with `Fonts.bodySemiBoldFamily`, color `Colors.text3`
- Username: Use `Fonts.displayFamily` (BarlowCondensed-Bold), fontSize 38, color `Colors.text1`
- Dump Score line: Use `Fonts.monoFamily`, fontSize 13, color `Colors.gold`
- Add 8px gap between name and score
- Add a subtle gold glow behind the greeting area (absolute positioned radial gradient, very faint)

### 3B. BEGIN SESSION Button

**Current:** Entire button pulses opacity which feels glitchy/broken, not intentional.

**Fix:**
- Remove the full-button pulse animation. Instead, add a subtle pulsing glow BEHIND the button (the shadow, not the button itself).
- The green status dot should pulse when connected to hardware. For manual mode, the dot should be static gray.
- Add `Seat connected · Bluetooth` or `Manual entry mode` as subtitle text.
- Button text: `Fonts.displayFamily`, fontSize 20, letterSpacing 2, uppercase.

```typescript
// Shadow glow pulse (not the button itself)
const glowOpacity = useSharedValue(0.3);
useEffect(() => {
  glowOpacity.value = withRepeat(
    withSequence(
      withTiming(0.6, { duration: 1200 }),
      withTiming(0.3, { duration: 1200 })
    ),
    -1, true
  );
}, []);

const glowStyle = useAnimatedStyle(() => ({
  shadowOpacity: glowOpacity.value,
}));
```

### 3C. Stats Row

**Current:** Cards look flat, values use system monospace.

**Fix:**
- StatCard values: Use `Fonts.monoMediumFamily`, fontSize 28 (slightly larger)
- StatCard labels: Use `Fonts.bodySemiBoldFamily`, letterSpacing 1.5
- Add slight padding increase (16px instead of 14px)
- The STREAK card should show a fire emoji before the day count (e.g., "14d") — wait, no emoji in UI. Instead, show streak as just the number with a small gold underline accent if streak > 7.

### 3D. Last Session Card

**Current:** Functional but boring.

**Fix:**
- Duration and weight values: Use `Fonts.monoMediumFamily`, fontSize 28
- Add a thin gold top border (`borderTopWidth: 2, borderTopColor: Colors.goldDim`) if it was a personal record
- The RECORD badge should have a subtle shimmer animation (optional, low priority)

### 3E. Empty State

**Current:** Generic text.

**Fix:**
- "Your throne awaits." — Use `Fonts.displayFamily`, fontSize 24, color `Colors.text1`
- Add a faint crown icon (from Ionicons, size 48, color `Colors.goldDim`) above the text

---

## PRIORITY 4: ONBOARDING (`app/(auth)/welcome.tsx`)

### 4A. Panel 1 (Splash)

**Current:** "U·DUMP" wordmark in system bold. Looks like a prototype.

**Fix:**
- Wordmark: Use `Fonts.displayFamily`, fontSize 80, color `Colors.gold`, letterSpacing: -3
- Lines below: Use `Fonts.bodyFamily`, fontSize 17, color `Colors.text2`, line height 28
- Add a very subtle radial gold glow behind the wordmark (absolute positioned, 200px radius, Colors.goldGlow)

### 4B. Panel 2 (Pitch)

**Problem:** Uses a toilet emoji (🚽). BUILD_SPEC says NO poop/toilet emoji in UI. Crown only.

**Fix:** Remove the toilet emoji entirely. The pitch copy is strong enough on its own. Replace with a subtle crown icon or just empty space.

### 4C. Panel 3 (Features)

**Problem:** Feature icons are emoji (📊👑🏆). Looks cheap.

**Fix:** Replace with Ionicons:
- `analytics-outline` for "Log every session"
- `trophy-outline` for "Claim thrones"
- `podium-outline` for "Compete on leaderboard"

Color all icons `Colors.gold`, size 24.

### 4D. Dot Indicators

**Current:** Round dots, active dot is wider. Fine, but refine:
- Inactive: 6x6, `Colors.glass3` (not text3 — too bright)
- Active: 24x6 (wider), `Colors.gold`, border-radius 3

---

## PRIORITY 5: ACTIVE SESSION SCREEN (`app/session/active.tsx`)

### 5A. Timer Display

**Fix:**
- Timer digits: Use `Fonts.monoFamily`, fontSize 72 (bigger), color `Colors.text1`
- Timer should have ultra-thin letter-spacing (2px) for that premium clock feel
- The pulse animation should be very subtle (opacity 0.85 to 1.0), NOT 0.75 to 1.0

### 5B. Sonar Rings

**Current:** Basic expanding circles.

**Fix:**
- Ring color should be `Colors.goldDim` (not white)
- 3 rings, staggered by 1.3s each
- Rings should expand from center and fade out
- Ring stroke width: 1px (thinner = more premium)

### 5C. Weight Entry Bottom Sheet

**Fix:**
- Use `@gorhom/bottom-sheet` if not already (it's more polished than custom)
- Sheet background: `Colors.surface` with `BlurView`
- Input fields: Use `Fonts.monoMediumFamily` for weight numbers, fontSize 32
- Weight delta display: `Fonts.monoMediumFamily`, fontSize 36, color `Colors.gold`

---

## PRIORITY 6: RESULTS SCREEN (`app/session/results.tsx`)

### 6A. Record State

**Fix:**
- Crown icon: Replace emoji with Ionicons `trophy`, size 56, color `Colors.gold`
- "NEW PERSONAL RECORD" badge: Use `Fonts.bodySemiBoldFamily`, letterSpacing 2
- Weight number counting animation: Use `Fonts.monoFamily`, fontSize 96 (hero size)
- Add a radial gold glow behind the weight number

### 6B. Achievement Overlay

**Fix:**
- Achievement card: GlassCard with `gold={true}` border
- Icon: fontSize 40, centered
- Title: `Fonts.displayFamily`, fontSize 20, color `Colors.text1`
- Description: `Fonts.bodyFamily`, fontSize 14, color `Colors.text2`
- Tier indicator: Small colored dot (bronze/silver/gold/platinum) next to title

---

## PRIORITY 7: SOCIAL SCREEN (`app/(tabs)/social.tsx`)

### 7A. Tab Switcher (Feed | Leaderboard)

**Fix:**
- Use `Fonts.bodySemiBoldFamily` for tab labels
- Active tab: gold underline (2px), gold text
- Inactive tab: no underline, `Colors.text3`
- Add horizontal padding between tabs (not cramped)

### 7B. Feed Items

**Fix:**
- Username: `Fonts.displayFamily`, fontSize 16
- Timestamp: `Fonts.monoFamily`, fontSize 11, color `Colors.text3`
- Stats numbers: `Fonts.monoMediumFamily`, fontSize 20
- Unit labels (lbs, min): `Fonts.bodyFamily`, fontSize 11, color `Colors.text3`

### 7C. Leaderboard Rows

**Fix:**
- Rank number: `Fonts.monoMediumFamily`, fontSize 16, color `Colors.text3` (gold for top 3)
- Name: `Fonts.displayFamily`, fontSize 16
- Weight: `Fonts.monoMediumFamily`, fontSize 16, color `Colors.gold`
- Top 3 rows should have `gold={true}` GlassCard border
- Bobby's row: always last, slightly dimmer (opacity 0.7 on the whole row)

---

## PRIORITY 8: DUMP SCORE SCREEN (`app/(tabs)/activity.tsx`)

### 8A. Score Display

**Fix:**
- Score number: `Fonts.monoFamily`, fontSize 72, color `Colors.gold`
- "DUMP SCORE" label: `Type.label`, color `Colors.text3`
- Percentile text: `Fonts.monoFamily`, fontSize 13

### 8B. Factor Bars

**Fix:**
- Bar track: height 6px, backgroundColor `Colors.glass2`, borderRadius 3
- Bar fill: height 6px, backgroundColor `Colors.gold`, borderRadius 3
- Factor label: `Fonts.bodySemiBoldFamily`, fontSize 13
- Factor value: `Fonts.monoMediumFamily`, fontSize 13, color `Colors.gold`

---

## NON-NEGOTIABLE RULES (ENFORCE THESE)

1. **No emoji anywhere in the app UI.** Use Ionicons from `@expo/vector-icons`. The only exception is inside feed content where users generate text. Crown emoji is tolerable only if Ionicons doesn't have a suitable alternative.
2. **No `fontFamily: 'System'`** — every text element must use one of the Barlow/DM Mono custom fonts.
3. **No `fontWeight` with custom fonts** — weight is encoded in the font file. Use the correct font family variant instead.
4. **No hardcoded colors** — everything from `Colors` constant.
5. **No inline styles** — `StyleSheet.create` only.
6. **Bobby is always last** in any leaderboard or ranking.
7. **All number displays** (weights, scores, times, durations) must use `Fonts.monoFamily` or `Fonts.monoMediumFamily`.
8. **All labels/eyebrows** must use `Fonts.bodySemiBoldFamily` with `letterSpacing: 1.2+` and `textTransform: 'uppercase'`.
9. **All heading/display text** must use `Fonts.displayFamily` (BarlowCondensed-Bold).

---

## VERIFICATION CHECKLIST

After completing each screen, verify:

- [ ] All text uses custom fonts (no System font visible)
- [ ] All colors come from Colors constant (no hex in component files)
- [ ] Glass cards have inner gradient overlay
- [ ] Tab bar uses proper icons (no emoji)
- [ ] Number displays use mono font
- [ ] Labels use uppercase + letter-spacing
- [ ] Contrast is readable (text2 at 0.72, text3 at 0.42)
- [ ] Haptic feedback on all tappable elements
- [ ] Animations use Reanimated 3 (not Animated API)
- [ ] No poop/toilet emoji anywhere
- [ ] Bobby is last in all leaderboards
- [ ] App builds and runs without errors in Expo Go

---

## BUILD ORDER

1. Download and install fonts → `assets/fonts/`
2. Update `constants/typography.ts` with custom font families
3. Update `constants/colors.ts` with contrast fixes
4. Update `app/_layout.tsx` to load fonts with `useFonts`
5. Update `components/ui/GlassCard.tsx` with gradient overlay + gold variant
6. Update `components/ui/GoldButton.tsx` with correct gradient + font
7. Update `app/(tabs)/_layout.tsx` — replace emoji tab bar with Ionicons
8. Update `app/(auth)/welcome.tsx` — fonts, remove emoji, refine spacing
9. Update `app/(tabs)/index.tsx` — home screen polish
10. Update `app/(tabs)/activity.tsx` — dump score polish
11. Update `app/(tabs)/social.tsx` — feed + leaderboard polish
12. Update `app/session/active.tsx` — session screen polish
13. Update `app/session/results.tsx` — results screen polish
14. Final visual QA pass on every screen

**Do steps 1-7 first as a single task. Then do 8-13 one screen at a time, verifying each before moving on.**
