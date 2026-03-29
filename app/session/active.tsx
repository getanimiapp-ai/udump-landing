import { useSessionStore } from '@/lib/store/session.store';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { GlassCard } from '../../components/ui/GlassCard';
import { GoldButton } from '../../components/ui/GoldButton';
import { FadeInView } from '../../components/ui/FadeInView';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────
// AI Coach Messages
// ─────────────────────────────────────────────

const COACH_MESSAGES: { minSec: number; maxSec: number; messages: string[] }[] = [
  {
    minSec: 10, maxSec: 30,
    messages: [
      'The throne recognizes your presence.',
      'Session initiated. The kingdom is watching.',
      'Settle in. Greatness takes focus.',
    ],
  },
  {
    minSec: 60, maxSec: 120,
    messages: [
      'Posture check. Champions sit with intention.',
      'Breathe deep. Let gravity do its work.',
      'Relaxation is the key to peak performance.',
    ],
  },
  {
    minSec: 180, maxSec: 300,
    messages: [
      'You\'re in the zone now. Stay present.',
      'Your consistency is building your legacy.',
      'Bobby gave up at this point. You won\'t.',
    ],
  },
  {
    minSec: 360, maxSec: 600,
    messages: [
      'Elite territory. Most people have left the throne by now.',
      'The longer you stay, the stronger the claim.',
      'Did you know? Top performers average 8+ minutes.',
    ],
  },
  {
    minSec: 660, maxSec: 900,
    messages: [
      'Dedicated. The records are within reach.',
      'Your throne time exceeds 90% of users.',
      'Historians will note this session.',
    ],
  },
  {
    minSec: 1200, maxSec: 1800,
    messages: [
      'You\'re approaching legendary status.',
      'At this point it\'s about sending a message.',
      'Your friends are receiving notifications. Make them count.',
    ],
  },
  {
    minSec: 2400, maxSec: 3600,
    messages: [
      'Are you okay in there? Serious question.',
      'Your dedication is... concerning. But respected.',
      'Phone battery check recommended.',
    ],
  },
];

function getCoachMessage(elapsed: number): string | null {
  for (const tier of COACH_MESSAGES) {
    if (elapsed >= tier.minSec && elapsed <= tier.maxSec) {
      if (elapsed === tier.minSec || (elapsed - tier.minSec) % 45 === 0) {
        return tier.messages[Math.floor(Math.random() * tier.messages.length)];
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// Milestones
// ─────────────────────────────────────────────

const MILESTONES: { seconds: number; label: string; points: number; haptic: Haptics.ImpactFeedbackStyle }[] = [
  { seconds: 60, label: 'WARMING UP', points: 5, haptic: Haptics.ImpactFeedbackStyle.Light },
  { seconds: 300, label: 'COMMITTED', points: 15, haptic: Haptics.ImpactFeedbackStyle.Medium },
  { seconds: 600, label: 'ELITE TERRITORY', points: 30, haptic: Haptics.ImpactFeedbackStyle.Rigid },
  { seconds: 900, label: 'DEDICATED', points: 50, haptic: Haptics.ImpactFeedbackStyle.Heavy },
  { seconds: 1800, label: 'LEGENDARY', points: 100, haptic: Haptics.ImpactFeedbackStyle.Heavy },
];

const PR_DURATION_DEFAULT = 600;
const RING_SIZE = 240;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─────────────────────────────────────────────
// Progress Ring
// ─────────────────────────────────────────────

function ProgressRing({ progress }: { progress: number }) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const dashOffset = RING_CIRCUMFERENCE * (1 - clamped);

  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={ringStyles.svg}>
      <Defs>
        <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={Colors.gold} stopOpacity="0.3" />
          <Stop offset="0.5" stopColor={Colors.goldBright} stopOpacity="1" />
          <Stop offset="1" stopColor={Colors.gold} stopOpacity="0.6" />
        </SvgGradient>
      </Defs>
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={RING_STROKE}
        fill="none"
      />
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke="url(#ringGrad)"
        strokeWidth={RING_STROKE}
        fill="none"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
      />
    </Svg>
  );
}

const ringStyles = StyleSheet.create({
  svg: { position: 'absolute', top: 0, left: 0 },
});

// ─────────────────────────────────────────────
// Milestone Banner
// ─────────────────────────────────────────────

function MilestoneBanner({ label, points, onDone }: { label: string; points: number; onDone: () => void }) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const dismiss = () => onDone();

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });

    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(dismiss)();
      });
    }, 2500);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.milestoneBanner, style]} pointerEvents="none">
      <LinearGradient
        colors={[Colors.goldDim, 'rgba(212,175,55,0.08)']}
        style={styles.milestoneBg}
      />
      <Ionicons name="trophy" size={16} color={Colors.gold} />
      <Text style={styles.milestoneText}>{label}</Text>
      <View style={styles.milestonePoints}>
        <Text style={styles.milestonePointsText}>+{points} XP</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Coach Bubble
// ─────────────────────────────────────────────

function CoachBubble({ message, onDone }: { message: string; onDone: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 14 });

    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
    }, 4000);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.coachBubble, style]}>
      <Ionicons name="chatbubble-ellipses" size={14} color={Colors.gold} />
      <Text style={styles.coachText}>{message}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { activeSession, startSession, endSession, cancelSession } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [weightBefore, setWeightBefore] = useState('');
  const [weightAfter, setWeightAfter] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<{ label: string; points: number } | null>(null);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggeredMilestonesRef = useRef<Set<number>>(new Set());

  const timerPulse = useSharedValue(1);
  const sonar1Scale = useSharedValue(1);
  const sonar2Scale = useSharedValue(1);
  const sonar3Scale = useSharedValue(1);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);
  const xpScale = useSharedValue(1);

  const weightDelta =
    weightBefore && weightAfter
      ? parseFloat(weightAfter) - parseFloat(weightBefore)
      : null;

  useEffect(() => {
    if (!activeSession) {
      startSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    timerPulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    const sonarAnim = (val: Animated.SharedValue<number>, delay: number) => {
      val.value = withRepeat(
        withSequence(
          withTiming(delay > 0 ? 1 : 1, { duration: delay }),
          withTiming(2.5, { duration: 2500, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
    };

    sonarAnim(sonar1Scale, 0);
    sonarAnim(sonar2Scale, 1333);
    sonarAnim(sonar3Scale, 2666);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;

        for (const milestone of MILESTONES) {
          if (next === milestone.seconds && !triggeredMilestonesRef.current.has(milestone.seconds)) {
            triggeredMilestonesRef.current.add(milestone.seconds);
            Haptics.impactAsync(milestone.haptic);
            if (milestone.seconds >= 900) {
              setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
            }
            setActiveMilestone({ label: milestone.label, points: milestone.points });
            setTotalXP((xp) => xp + milestone.points);
          }
        }

        // Coach messages
        const msg = getCoachMessage(next);
        if (msg) {
          setCoachMessage(msg);
        }

        // Overstay haptics
        if (next === 3600) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        if (next === 7200) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));

  const sonar1Style = useAnimatedStyle(() => ({
    transform: [{ scale: sonar1Scale.value }],
    opacity: 2.5 - sonar1Scale.value,
  }));
  const sonar2Style = useAnimatedStyle(() => ({
    transform: [{ scale: sonar2Scale.value }],
    opacity: 2.5 - sonar2Scale.value,
  }));
  const sonar3Style = useAnimatedStyle(() => ({
    transform: [{ scale: sonar3Scale.value }],
    opacity: 2.5 - sonar3Scale.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const openSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetVisible(true);
    sheetTranslateY.value = withSpring(0, { damping: 18, stiffness: 200 });
  };

  const closeSheet = () => {
    sheetTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    setTimeout(() => setSheetVisible(false), 320);
  };

  const handleEndPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Finished Already?',
      'Are you sure you\'re done? You might have more to give. Champions push through.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'I\'m Done',
          onPress: openSheet,
        },
      ]
    );
  };

  const handleEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const wBefore = weightBefore ? parseFloat(weightBefore) : null;
    const wAfter = weightAfter ? parseFloat(weightAfter) : null;

    const result = await endSession(wBefore, wAfter);
    if (result) {
      router.replace({
        pathname: '/session/results',
        params: {
          sessionId: result.id,
          durationSeconds: result.durationSeconds.toString(),
          weightDelta: result.weightDelta?.toString() ?? '',
          isPersonalRecord: result.isPersonalRecord ? '1' : '0',
          throneClaimed: result.throneClaimed ? '1' : '0',
          throneId: result.throneId ?? '',
          newAchievements: JSON.stringify(result.newAchievements),
        },
      });
    } else {
      setIsEnding(false);
    }
  };

  const handleCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Abandon Session?',
      'Don\'t be a quitter. This session will NOT be saved and your streak may suffer. The throne remembers cowards.',
      [
        { text: 'You\'re Right, Keep Going', style: 'cancel' },
        {
          text: 'Abandon Ship',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await cancelSession();
            router.back();
          },
        },
      ]
    );
  };

  const ringProgress = Math.min(elapsed / PR_DURATION_DEFAULT, 1);
  const currentMilestoneLabel = (() => {
    let label = 'JUST STARTED';
    for (const m of MILESTONES) {
      if (elapsed >= m.seconds) label = m.label;
    }
    return label;
  })();

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(212,175,55,0.04)', 'transparent', 'rgba(212,175,55,0.02)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Sonar rings */}
      <View style={styles.sonarContainer}>
        <Animated.View style={[styles.sonarRing, sonar1Style]} />
        <Animated.View style={[styles.sonarRing, sonar2Style]} />
        <Animated.View style={[styles.sonarRing, sonar3Style]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top bar: XP + Status */}
          <FadeInView delay={200}>
            <View style={styles.topBar}>
              <View style={styles.xpBadge}>
                <Ionicons name="flash" size={12} color={Colors.gold} />
                <Text style={styles.xpText}>{totalXP} XP</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{currentMilestoneLabel}</Text>
              </View>
            </View>
          </FadeInView>

          {/* Timer with progress ring */}
          <Animated.View style={[styles.timerContainer, timerStyle]}>
            <View style={styles.ringWrapper}>
              <ProgressRing progress={ringProgress} />
              <View style={styles.timerInner}>
                <Text style={styles.timerLabel}>SESSION TIME</Text>
                <Text style={styles.timer} numberOfLines={1} adjustsFontSizeToFit>
                  {formatTime(elapsed)}
                </Text>
                {elapsed >= 3600 && (
                  <View style={styles.overstayBadge}>
                    <Ionicons name="warning" size={12} color={Colors.red} />
                    <Text style={styles.overstayWarning}>
                      {elapsed >= 7200 ? '2+ HOURS' : '60+ MINUTES'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Coach message area */}
          <View style={styles.coachArea}>
            {coachMessage && (
              <CoachBubble
                key={coachMessage + elapsed}
                message={coachMessage}
                onDone={() => setCoachMessage(null)}
              />
            )}
          </View>

          {/* Action buttons */}
          <FadeInView delay={400}>
            <View style={styles.actions}>
              {/* End Session (primary) */}
              <GoldButton
                label={isEnding ? 'SAVING...' : 'FINISH SESSION'}
                onPress={handleEndPress}
                disabled={isEnding}
                style={styles.endBtn}
              />

              {/* Cancel (secondary, scary) */}
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>ABANDON SESSION</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </View>
      </SafeAreaView>

      {/* Milestone banner */}
      {activeMilestone && (
        <MilestoneBanner
          key={activeMilestone.label}
          label={activeMilestone.label}
          points={activeMilestone.points}
          onDone={() => setActiveMilestone(null)}
        />
      )}

      {/* Weight entry bottom sheet */}
      {sheetVisible && (
        <Animated.View style={[styles.sheetOverlay, sheetStyle]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sheetKAV}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Ionicons name="scale-outline" size={20} color={Colors.gold} />
                <Text style={styles.sheetTitle}>WEIGH IN</Text>
              </View>
              <Text style={styles.sheetSub}>Optional. Step on the scale before and after for weight tracking.</Text>

              <View style={styles.weightRow}>
                <View style={styles.weightField}>
                  <Text style={styles.weightLabel}>BEFORE</Text>
                  <View style={styles.weightInputRow}>
                    <TextInput
                      style={styles.weightInput}
                      value={weightBefore}
                      onChangeText={setWeightBefore}
                      placeholder="0.0"
                      placeholderTextColor={Colors.text3}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.weightUnit}>lbs</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={18} color={Colors.text3} />
                <View style={styles.weightField}>
                  <Text style={styles.weightLabel}>AFTER</Text>
                  <View style={styles.weightInputRow}>
                    <TextInput
                      style={styles.weightInput}
                      value={weightAfter}
                      onChangeText={setWeightAfter}
                      placeholder="0.0"
                      placeholderTextColor={Colors.text3}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.weightUnit}>lbs</Text>
                  </View>
                </View>
              </View>

              {weightDelta !== null && (
                <View style={styles.weightDeltaRow}>
                  <Ionicons name="trending-down" size={18} color={Colors.gold} />
                  <Text style={styles.weightDelta}>
                    {weightDelta >= 0 ? '+' : ''}{weightDelta.toFixed(2)} lbs
                  </Text>
                </View>
              )}

              <GoldButton
                label={isEnding ? 'SAVING...' : 'CONFIRM & CLAIM GLORY'}
                onPress={handleEnd}
                disabled={isEnding}
                style={styles.confirmBtn}
              />

              <TouchableOpacity onPress={closeSheet} style={styles.cancelSheetBtn}>
                <Text style={styles.cancelSheetText}>Actually, I have more to give</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  sonarContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sonarRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpText: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 12,
    color: Colors.gold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.glass2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  statusText: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.text2,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE - RING_STROKE * 4,
    gap: 4,
  },
  timerLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
    letterSpacing: 2,
  },
  timer: {
    fontFamily: Fonts.monoFamily,
    fontSize: 52,
    color: Colors.text1,
    letterSpacing: 2,
    textAlign: 'center',
    width: '100%',
  },
  overstayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  overstayWarning: {
    ...Type.label,
    color: Colors.red,
    fontSize: 10,
  },
  coachArea: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.glass2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '90%',
  },
  coachText: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 13,
    color: Colors.text2,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  endBtn: {},
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
    backgroundColor: 'rgba(255,59,48,0.06)',
  },
  cancelBtnText: {
    ...Type.label,
    color: Colors.red,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  milestoneBanner: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  milestoneBg: {
    ...StyleSheet.absoluteFillObject,
  },
  milestoneText: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 13,
    letterSpacing: 2,
  },
  milestonePoints: {
    backgroundColor: Colors.gold,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  milestonePointsText: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 10,
    color: '#000',
  },
  sheetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.glassBorder,
  },
  sheetKAV: {
    flex: 0,
  },
  sheet: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.glassBorderHi,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    ...Type.label,
    color: Colors.text1,
    fontSize: 15,
    letterSpacing: 2,
  },
  sheetSub: {
    ...Type.caption,
    color: Colors.text3,
    marginTop: -8,
    lineHeight: 18,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightField: {
    flex: 1,
    gap: 4,
  },
  weightLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightInput: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 32,
    color: Colors.text1,
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  weightUnit: {
    ...Type.caption,
    color: Colors.text3,
  },
  weightDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weightDelta: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 36,
    color: Colors.gold,
    textAlign: 'center',
  },
  confirmBtn: {
    marginTop: 4,
  },
  cancelSheetBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelSheetText: {
    ...Type.caption,
    color: Colors.text3,
    fontStyle: 'italic',
  },
});
