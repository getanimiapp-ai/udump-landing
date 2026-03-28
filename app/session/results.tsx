import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
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
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  }>();

  const isPersonalRecord = params.isPersonalRecord === '1';
  const throneClaimed = params.throneClaimed === '1';
  const durationSeconds = parseInt(params.durationSeconds ?? '0', 10);
  const weightDelta = params.weightDelta ? parseFloat(params.weightDelta) : null;

  const crownScale = useSharedValue(0);
  const crownOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

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
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
  }, []);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
    opacity: crownOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const getHeaderContent = () => {
    if (isPersonalRecord) {
      return { badge: 'NEW PERSONAL RECORD', title: null };
    }
    if (throneClaimed) {
      return { badge: 'THRONE CLAIMED', title: null };
    }
    return { badge: null, title: 'Session Complete' };
  };

  const { badge, title } = getHeaderContent();

  const getInsightText = () => {
    if (isPersonalRecord) return 'You have exceeded your previous best. The crown is yours.';
    if (throneClaimed) return 'Throne secured. Your friends have been notified.';
    if (weightDelta && weightDelta > 2) return 'Impressive output. Your Dump Score™ has been updated.';
    return 'Solid consistency. Your streak continues.';
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
        {/* Crown / Header */}
        <Animated.View style={[styles.heroSection, crownStyle]}>
          <Text style={styles.crownIcon}>👑</Text>
          {badge && (
            <Badge
              label={badge}
              color={isPersonalRecord ? 'gold' : throneClaimed ? 'gold' : 'default'}
            />
          )}
          {title && <Text style={styles.resultTitle}>{title}</Text>}

          {weightDelta != null && (
            <Text style={styles.weightBig}>{weightDelta.toFixed(2)}</Text>
          )}
          <Text style={styles.statsLine}>
            {formatDuration(durationSeconds)}
            {weightDelta != null ? ` · ${weightDelta.toFixed(2)} LBS` : ''}
          </Text>
        </Animated.View>

        {/* Stats Card */}
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

        {/* Actions */}
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
  crownIcon: {
    fontSize: 64,
  },
  resultTitle: {
    ...Type.display,
    fontSize: 28,
    color: Colors.text1,
    textAlign: 'center',
  },
  weightBig: {
    ...Type.mono,
    fontSize: 96,
    fontWeight: '700',
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
    ...Type.mono,
    fontSize: 16,
    color: Colors.text1,
    fontWeight: '700',
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
});
