import { useSessionStore } from '@/lib/store/session.store';
import * as Haptics from 'expo-haptics';
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
import Svg, { Circle } from 'react-native-svg';
import { GlassCard } from '../../components/ui/GlassCard';
import { GoldButton } from '../../components/ui/GoldButton';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const MILESTONES: { seconds: number; label: string; haptic: Haptics.ImpactFeedbackStyle }[] = [
  { seconds: 60, label: 'WARMING UP', haptic: Haptics.ImpactFeedbackStyle.Light },
  { seconds: 300, label: 'COMMITTED', haptic: Haptics.ImpactFeedbackStyle.Medium },
  { seconds: 600, label: 'ELITE TERRITORY', haptic: Haptics.ImpactFeedbackStyle.Rigid },
  { seconds: 900, label: 'DEDICATED', haptic: Haptics.ImpactFeedbackStyle.Heavy },
  { seconds: 1800, label: 'LEGENDARY', haptic: Haptics.ImpactFeedbackStyle.Heavy },
];

const PR_DURATION_DEFAULT = 600;
const RING_SIZE = 220;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProgressRingProps {
  progress: number;
}

function ProgressRing({ progress }: ProgressRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const dashOffset = RING_CIRCUMFERENCE * (1 - clamped);
  const r = Math.round(255 + (212 - 255) * clamped);
  const g = Math.round(255 + (175 - 255) * clamped);
  const b = Math.round(255 + (55 - 255) * clamped);
  const a = (0.08 + 0.92 * clamped).toFixed(2);
  const color = `rgba(${r},${g},${b},${a})`;

  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={ringStyles.svg}>
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={RING_STROKE}
        fill="none"
      />
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke={color}
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
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

interface MilestoneBannerProps {
  label: string;
  onDone: () => void;
}

function MilestoneBanner({ label, onDone }: MilestoneBannerProps) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const dismiss = () => onDone();

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200 });

    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(dismiss)();
      });
    }, 2000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.milestoneBanner, style]} pointerEvents="none">
      <Text style={styles.milestoneText}>{label}</Text>
    </Animated.View>
  );
}

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { activeSession, startSession, endSession, cancelSession } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [weightBefore, setWeightBefore] = useState('');
  const [weightAfter, setWeightAfter] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cancelProgress, setCancelProgress] = useState(0);
  const triggeredMilestonesRef = useRef<Set<number>>(new Set());

  const timerOpacity = useSharedValue(1);
  const sonar1Scale = useSharedValue(1);
  const sonar2Scale = useSharedValue(1);
  const sonar3Scale = useSharedValue(1);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);

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
    timerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    const sonarAnim = (val: Animated.SharedValue<number>, delay: number) => {
      val.value = withRepeat(
        withSequence(
          withTiming(delay > 0 ? 1 : 1, { duration: delay }),
          withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.quad) }),
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
            if (milestone.seconds === 1800) {
              setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
            }
            setActiveMilestone(milestone.label);
          }
        }

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
    opacity: timerOpacity.value,
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

  const handleEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

  const handleCancelPressIn = () => {
    cancelPressRef.current = setTimeout(() => {
      Alert.alert(
        'Cancel Session',
        'This session will not be saved.',
        [
          { text: 'Keep Going', style: 'cancel' },
          {
            text: 'Cancel Session',
            style: 'destructive',
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await cancelSession();
              router.back();
            },
          },
        ]
      );
    }, 2000);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      setCancelProgress(Math.min(progress, 1));
      if (progress >= 1) clearInterval(interval);
    }, 100);
  };

  const handleCancelPressOut = () => {
    if (cancelPressRef.current) clearTimeout(cancelPressRef.current);
    setCancelProgress(0);
  };

  const ringProgress = Math.min(elapsed / PR_DURATION_DEFAULT, 1);

  return (
    <View style={styles.container}>
      {/* Sonar rings */}
      <View style={styles.sonarContainer}>
        <Animated.View style={[styles.sonarRing, sonar1Style]} />
        <Animated.View style={[styles.sonarRing, sonar2Style]} />
        <Animated.View style={[styles.sonarRing, sonar3Style]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Timer with progress ring */}
          <Animated.View style={[styles.timerContainer, timerStyle]}>
            <View style={styles.ringWrapper}>
              <ProgressRing progress={ringProgress} />
              <View style={styles.timerInner}>
                <Text style={styles.timer} numberOfLines={1} adjustsFontSizeToFit>{formatTime(elapsed)}</Text>
                {elapsed >= 3600 && (
                  <Text style={styles.overstayWarning}>
                    {elapsed >= 7200 ? '2+ HOURS' : '60+ MINUTES'}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* End Session Button */}
          <TouchableOpacity
            onPress={openSheet}
            disabled={isEnding}
            style={styles.endBtn}
          >
            <GlassCard style={styles.endBtnCard} intensity={30}>
              <View style={styles.endBtnContent}>
                <Text style={styles.endBtnLabel}>END SESSION</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Cancel (hold 2s) */}
          <TouchableOpacity
            onPressIn={handleCancelPressIn}
            onPressOut={handleCancelPressOut}
            style={styles.cancelBtn}
            activeOpacity={0.7}
          >
            <View style={styles.cancelProgressTrack}>
              <View
                style={[
                  styles.cancelProgressFill,
                  { width: `${Math.round(cancelProgress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.cancelBtnText}>
              {cancelProgress > 0
                ? `CANCELLING... ${Math.round(cancelProgress * 100)}%`
                : 'HOLD 2S TO CANCEL'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Milestone banner */}
      {activeMilestone && (
        <MilestoneBanner
          key={activeMilestone}
          label={activeMilestone}
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
              <Text style={styles.sheetTitle}>WEIGHT ENTRY</Text>
              <Text style={styles.sheetSub}>Optional. Enter your weight before and after.</Text>

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
                <Text style={styles.weightArrow}>→</Text>
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
                <Text style={styles.weightDelta}>
                  {weightDelta >= 0 ? '+' : ''}{weightDelta.toFixed(2)} lbs
                </Text>
              )}

              <GoldButton
                label={isEnding ? 'SAVING...' : 'CONFIRM & END'}
                onPress={handleEnd}
                disabled={isEnding}
                style={styles.confirmBtn}
              />

              <TouchableOpacity onPress={closeSheet} style={styles.cancelSheetBtn}>
                <Text style={styles.cancelSheetText}>Keep going</Text>
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
    borderColor: 'rgba(212,175,55,0.15)',
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
    gap: 8,
  },
  timer: {
    fontFamily: Fonts.monoFamily,
    fontSize: 56,
    color: Colors.text1,
    letterSpacing: 2,
    textAlign: 'center',
    width: '100%',
  },
  overstayWarning: {
    ...Type.label,
    color: Colors.red,
    fontSize: 12,
  },
  endBtn: {
    marginBottom: 8,
  },
  endBtnCard: {
    borderColor: Colors.glassBorderHi,
  },
  endBtnContent: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  endBtnLabel: {
    ...Type.label,
    color: Colors.text1,
    fontSize: 15,
    letterSpacing: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass1,
    overflow: 'hidden',
    gap: 8,
  },
  cancelProgressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  cancelProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  cancelBtnText: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  milestoneBanner: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  milestoneText: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 13,
    letterSpacing: 2,
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
  weightArrow: {
    color: Colors.text3,
    fontSize: 18,
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
  },
});
