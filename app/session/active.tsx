import { useSessionStore } from '@/lib/store/session.store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { activeSession, startSession, endSession, cancelSession } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [weightBefore, setWeightBefore] = useState('');
  const [weightAfter, setWeightAfter] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cancelProgress, setCancelProgress] = useState(0);

  const timerOpacity = useSharedValue(1);
  const sonar1Scale = useSharedValue(1);
  const sonar2Scale = useSharedValue(1);
  const sonar3Scale = useSharedValue(1);

  useEffect(() => {
    if (!activeSession) {
      startSession();
    }
  }, []);

  useEffect(() => {
    timerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 1000 }),
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
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
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

  return (
    <View style={styles.container}>
      {/* Sonar rings */}
      <View style={styles.sonarContainer}>
        <Animated.View style={[styles.sonarRing, sonar1Style]} />
        <Animated.View style={[styles.sonarRing, sonar2Style]} />
        <Animated.View style={[styles.sonarRing, sonar3Style]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Timer */}
          <Animated.View style={[styles.timerContainer, timerStyle]}>
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>
            {elapsed >= 3600 && (
              <Text style={styles.overstayWarning}>
                {elapsed >= 7200 ? '🆘 2+ HOURS' : '⚠️ 60+ MINUTES'}
              </Text>
            )}
          </Animated.View>

          {/* Weight entry */}
          <GlassCard style={styles.weightCard}>
            <View style={styles.weightContent}>
              <Text style={styles.weightTitle}>WEIGHT ENTRY</Text>
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
            </View>
          </GlassCard>

          {/* End Session Button */}
          <TouchableOpacity
            onPress={handleEnd}
            disabled={isEnding}
            style={styles.endBtn}
          >
            <GlassCard style={styles.endBtnCard} intensity={30}>
              <View style={styles.endBtnContent}>
                <Text style={styles.endBtnLabel}>
                  {isEnding ? 'SAVING...' : 'END SESSION'}
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Cancel (hold 2s) */}
          <TouchableOpacity
            onPressIn={handleCancelPressIn}
            onPressOut={handleCancelPressOut}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>
              {cancelProgress > 0
                ? `Hold to cancel... ${Math.round(cancelProgress * 100)}%`
                : 'Hold 2s to cancel'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    left: '50%',
    width: 0,
    height: 0,
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
    marginLeft: -100,
    marginTop: -100,
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
    gap: 12,
  },
  timer: {
    ...Type.mono,
    fontSize: 80,
    fontWeight: '700',
    color: Colors.text1,
    letterSpacing: -2,
  },
  overstayWarning: {
    ...Type.label,
    color: Colors.red,
    fontSize: 12,
  },
  weightCard: {
    marginBottom: 16,
  },
  weightContent: {
    padding: 16,
    gap: 12,
  },
  weightTitle: {
    ...Type.label,
    color: Colors.text3,
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
    ...Type.mono,
    fontSize: 20,
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
    paddingVertical: 8,
  },
  cancelBtnText: {
    ...Type.caption,
    color: Colors.text3,
  },
});
