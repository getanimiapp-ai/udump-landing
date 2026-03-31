import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Badge } from '../../components/ui/Badge';
import { GlassCard } from '../../components/ui/GlassCard';
import { GoldButton } from '../../components/ui/GoldButton';
import { ACHIEVEMENTS } from '../../constants/achievements';
import { Colors, TIER_COLORS } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PARTICLE_COUNT = 12;
const PARTICLE_ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i * 360) / PARTICLE_COUNT);

function GoldParticleBloom({ visible }: { visible: boolean }) {
  const particles = PARTICLE_ANGLES.map((angle) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const distance = useSharedValue(0);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const opacity = useSharedValue(0);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (visible) {
        distance.value = withTiming(60, { duration: 800 });
        opacity.value = withTiming(1, { duration: 200 });
        setTimeout(() => { opacity.value = withTiming(0, { duration: 400 }); }, 400);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: dx * distance.value },
        { translateY: dy * distance.value },
      ],
      opacity: opacity.value,
    }));

    return { style, angle };
  });

  if (!visible) return null;

  return (
    <View style={particleStyles.container} pointerEvents="none">
      {particles.map(({ style }, i) => (
        <Animated.View key={i} style={[particleStyles.dot, style]} />
      ))}
    </View>
  );
}

const particleStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.goldBright,
  },
});

interface AchievementOverlayProps {
  achievementKey: string;
  onDismiss: () => void;
}

function AchievementUnlockOverlay({ achievementKey, onDismiss }: AchievementOverlayProps) {
  const achievement = ACHIEVEMENTS.find((a) => a.key === achievementKey);
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.7);
  const cardOpacity = useSharedValue(0);
  const dismissedRef = useRef(false);

  const tierColors = achievement ? TIER_COLORS[achievement.tier] : TIER_COLORS.bronze;

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    cardOpacity.value = withTiming(1, { duration: 350 });

    const timer = setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        overlayOpacity.value = withTiming(0, { duration: 400 });
        cardOpacity.value = withTiming(0, { duration: 350 });
        setTimeout(onDismiss, 400);
      }
    }, 3500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleTap = () => {
    if (!dismissedRef.current) {
      dismissedRef.current = true;
      overlayOpacity.value = withTiming(0, { duration: 300 });
      cardOpacity.value = withTiming(0, { duration: 250 });
      setTimeout(onDismiss, 300);
    }
  };

  if (!achievement) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlayContainer, overlayStyle]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={handleTap}
        activeOpacity={1}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.92)']}
          style={StyleSheet.absoluteFillObject}
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.overlayCard,
          { borderColor: tierColors.border },
          cardStyle,
        ]}
      >
        <Text style={styles.overlayLabel}>ACHIEVEMENT UNLOCKED</Text>
        <Text style={styles.overlayIcon}>{achievement.icon}</Text>
        <Text style={[styles.overlayTier, { color: tierColors.text }]}>
          {achievement.tier.toUpperCase()}
        </Text>
        <Text style={styles.overlayTitle}>{achievement.title}</Text>
        <Text style={styles.overlayDesc}>{achievement.description}</Text>
        <Text style={styles.overlayDismiss}>Tap to continue</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    durationSeconds: string;
    weightDelta: string;
    isPersonalRecord: string;
    throneClaimed: string;
    throneId: string;
    newAchievements: string;
  }>();

  const isPersonalRecord = params.isPersonalRecord === '1';
  const throneClaimed = params.throneClaimed === '1';
  const durationSeconds = parseInt(params.durationSeconds ?? '0', 10);
  const weightDelta = params.weightDelta ? parseFloat(params.weightDelta) : null;

  const newAchievementKeys: string[] = params.newAchievements
    ? (JSON.parse(params.newAchievements) as string[])
    : [];

  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);
  const [displayWeight, setDisplayWeight] = useState(0);

  const crownScale = useSharedValue(0);
  const crownOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(60);

  useEffect(() => {
    if (isPersonalRecord) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (throneClaimed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    crownScale.value = withSpring(1, { damping: 10, stiffness: 150 });
    crownOpacity.value = withTiming(1, { duration: 400 });
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    contentTranslateY.value = withDelay(300, withSpring(0, { damping: 14, stiffness: 120 }));

    // Weight count-up
    if (weightDelta != null && weightDelta > 0) {
      const target = weightDelta;
      const duration = 600;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setDisplayWeight(parseFloat((target * progress).toFixed(2)));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    if (newAchievementKeys.length > 0) {
      setTimeout(() => {
        setAchievementQueue(newAchievementKeys.slice(1));
        setCurrentAchievement(newAchievementKeys[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAchievementDismiss = () => {
    if (achievementQueue.length > 0) {
      const [next, ...rest] = achievementQueue;
      setCurrentAchievement(next);
      setAchievementQueue(rest);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setCurrentAchievement(null);
    }
  };

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
    opacity: crownOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const getHeaderContent = () => {
    if (isPersonalRecord) return { badge: 'NEW PERSONAL RECORD', title: null };
    if (throneClaimed) return { badge: 'THRONE CLAIMED', title: null };
    return { badge: null, title: 'Session Complete' };
  };

  const { badge, title } = getHeaderContent();

  const getInsightText = () => {
    if (isPersonalRecord) return 'New personal best. Bobby has been notified and is devastated.';
    if (throneClaimed) return 'Throne secured. The previous occupant has been dethroned and is embarrassed.';
    if (durationSeconds < 120) return 'Under 2 minutes. Efficient, if not artistic.';
    if (durationSeconds < 600) return 'A solid contribution to the historical record.';
    if (durationSeconds < 1200) return 'A proper sit. Philosophers have achieved less.';
    if (durationSeconds < 1800) return 'Historians will note this session.';
    return 'Your phone battery suffered. Your dedication did not.';
  };

  return (
    <SafeAreaView style={styles.container}>
      {(isPersonalRecord || throneClaimed) && (
        <LinearGradient
          colors={['rgba(212,175,55,0.08)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      <View style={styles.content}>
        <Animated.View style={[styles.heroSection, crownStyle]}>
          <Ionicons name="trophy" size={56} color={Colors.gold} />
          {badge && (
            <Badge
              label={badge}
              color={isPersonalRecord ? 'gold' : throneClaimed ? 'gold' : 'default'}
            />
          )}
          {title && <Text style={styles.resultTitle}>{title}</Text>}

          {weightDelta != null && (
            <Text style={styles.weightBig}>{displayWeight.toFixed(2)}</Text>
          )}
          <Text style={styles.statsLine}>
            {formatDuration(durationSeconds)}
            {weightDelta != null ? ` · ${weightDelta.toFixed(2)} LBS` : ''}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.statsSection, contentStyle]}>
          <GlassCard>
            <View style={styles.statsContent}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>DURATION</Text>
                <Text style={styles.statValue}>{formatDuration(durationSeconds)}</Text>
              </View>
              {weightDelta != null && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>WEIGHT DELTA</Text>
                  <Text style={[styles.statValue, styles.statValueGold]}>
                    {weightDelta.toFixed(2)} lbs
                  </Text>
                </View>
              )}
              <View style={[styles.statRow, styles.statRowLast]}>
                <Text style={styles.statLabel}>INSIGHT</Text>
              </View>
              <Text style={styles.insightText}>{getInsightText()}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View style={[styles.actions, contentStyle]}>
          <GoldButton
            label="DONE"
            onPress={() => router.replace('/(tabs)')}
            style={styles.doneBtn}
          />
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.shareBtn}
          >
            <Text style={styles.shareBtnText}>Share result</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <GoldParticleBloom visible={isPersonalRecord || throneClaimed} />

      {currentAchievement && (
        <AchievementUnlockOverlay
          key={currentAchievement}
          achievementKey={currentAchievement}
          onDismiss={handleAchievementDismiss}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 24,
    gap: 24,
  },
  heroSection: {
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontFamily: Fonts.displayFamily,
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.text1,
    textAlign: 'center',
  },
  weightBig: {
    fontFamily: Fonts.monoFamily,
    fontSize: 96,
    color: Colors.text1,
    letterSpacing: -3,
    lineHeight: 100,
  },
  statsLine: {
    ...Type.mono,
    fontSize: 12,
    color: Colors.text3,
    letterSpacing: 1,
  },
  statsSection: {},
  statsContent: {
    padding: 20,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    paddingBottom: 12,
  },
  statRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: -4,
  },
  statLabel: {
    ...Type.label,
    color: Colors.text3,
  },
  statValue: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 16,
    color: Colors.text1,
  },
  statValueGold: {
    color: Colors.gold,
  },
  insightText: {
    ...Type.body,
    color: Colors.text2,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  doneBtn: {},
  shareBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  shareBtnText: {
    ...Type.body,
    color: Colors.text3,
  },
  // Achievement overlay
  overlayContainer: {
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  overlayCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
  },
  overlayLabel: {
    ...Type.label,
    color: Colors.text3,
    letterSpacing: 2,
    fontSize: 10,
    marginBottom: 4,
  },
  overlayIcon: {
    fontSize: 64,
  },
  overlayTier: {
    ...Type.label,
    fontSize: 10,
    letterSpacing: 2,
  },
  overlayTitle: {
    fontFamily: Fonts.displayFamily,
    fontSize: 24,
    letterSpacing: -0.5,
    color: Colors.text1,
    textAlign: 'center',
  },
  overlayDesc: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlayDismiss: {
    ...Type.caption,
    color: Colors.text3,
    marginTop: 8,
  },
});
