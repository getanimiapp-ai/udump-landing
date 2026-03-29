import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { MOCK_ENABLED, MOCK_PROFILE, MOCK_TODAY_STATS, MOCK_LAST_SESSION } from '../../lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PressScale } from '../../components/ui/PressScale';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { FadeInView } from '../../components/ui/FadeInView';
import { StreakFlame } from '../../components/ui/StreakFlame';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function getRankTitle(score: number): string {
  if (score >= 9.5) return 'LEGENDARY';
  if (score >= 9) return 'ELITE';
  if (score >= 8) return 'CHAMPION';
  if (score >= 7) return 'VETERAN';
  if (score >= 5) return 'CONTENDER';
  if (score >= 3) return 'ROOKIE';
  return 'UNRANKED';
}

interface TodayStats {
  sessionCount: number;
  totalWeight: number;
  streakDays: number;
}

interface LastSession {
  id: string;
  ended_at: string;
  duration_seconds: number;
  weight_delta_lbs: number | null;
  is_personal_record: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [todayStats, setTodayStats] = useState<TodayStats>({ sessionCount: 0, totalWeight: 0, streakDays: 0 });
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const displayProfile = MOCK_ENABLED ? MOCK_PROFILE : profile;
  const displayStats = MOCK_ENABLED ? MOCK_TODAY_STATS : todayStats;
  const displayLastSession = MOCK_ENABLED ? MOCK_LAST_SESSION : lastSession;

  // Pulsing gold glow on START button
  const glowOpacity = useSharedValue(0.3);
  const glowScale = useSharedValue(1);
  // Crown rotation for flair
  const crownRotate = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0.2, { duration: 1200 })
      ),
      -1,
      true
    );
    glowScale.value = 1; // no scale pulse
    crownRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1200 }),
        withTiming(3, { duration: 2400 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotate.value}deg` }],
  }));

  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todaySessions } = await supabase
      .from('dump_sessions')
      .select('weight_delta_lbs')
      .eq('user_id', user.id)
      .gte('started_at', today.toISOString())
      .not('ended_at', 'is', null);

    if (todaySessions) {
      setTodayStats({
        sessionCount: todaySessions.length,
        totalWeight: todaySessions.reduce((sum, s) => sum + (s.weight_delta_lbs ?? 0), 0),
        streakDays: profile?.streak_days ?? 0,
      });
    }

    const { data: lastSess } = await supabase
      .from('dump_sessions')
      .select('id, ended_at, duration_seconds, weight_delta_lbs, is_personal_record')
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(1)
      .single();

    if (lastSess) setLastSession(lastSess);
  }, [profile?.streak_days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRefreshing(false);
  }, [fetchStats]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const dumpScore = displayProfile?.dump_score ?? 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gold}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting + Rank */}
          <FadeInView delay={0} slideFrom="bottom" slideDistance={15}>
            <View style={styles.greeting}>
              <Text style={styles.greetingLabel}>{getGreeting()}</Text>
              <View style={styles.nameRow}>
                <Text style={styles.greetingName}>{displayProfile?.display_name ?? 'Friend'}.</Text>
                <Animated.View style={crownStyle}>
                  <Text style={styles.crownIcon}>👑</Text>
                </Animated.View>
              </View>
              <View style={styles.rankRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{getRankTitle(dumpScore)}</Text>
                </View>
                <Text style={styles.dumpScore}>
                  {dumpScore.toFixed(1)}
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* START SESSION Button */}
          <FadeInView delay={100} slideFrom="bottom" slideDistance={15}>
            <Animated.View style={[styles.startButtonWrapper, glowStyle]}>
              <PressScale onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.push('/session/pre');
              }}>
                <LinearGradient
                  colors={['#D4AF37', '#F0CE60', '#D4AF37']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButton}
                >
                  <View style={styles.startButtonContent}>
                    <Ionicons name="flash" size={22} color="rgba(0,0,0,0.7)" />
                    <View style={styles.startButtonCenter}>
                      <Text style={styles.startButtonLabel}>CLAIM THE THRONE</Text>
                      <Text style={styles.startButtonSub}>Begin your session</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.4)" />
                  </View>
                </LinearGradient>
              </PressScale>
            </Animated.View>
          </FadeInView>

          {/* Stats Row with animated numbers */}
          <View style={styles.statsRow}>
            <FadeInView delay={200} style={styles.statFlex} slideFrom="bottom">
              <GlassCard style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>TODAY</Text>
                  <AnimatedNumber
                    value={displayStats.sessionCount}
                    style={styles.statValue}
                    hapticOnComplete
                  />
                </View>
              </GlassCard>
            </FadeInView>
            <FadeInView delay={300} style={styles.statFlex} slideFrom="bottom">
              <GlassCard style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>WEIGHT</Text>
                  <AnimatedNumber
                    value={displayStats.totalWeight}
                    decimals={1}
                    style={[styles.statValue, styles.statValueGold]}
                    suffix=" lbs"
                    hapticOnComplete
                  />
                </View>
              </GlassCard>
            </FadeInView>
            <FadeInView delay={400} style={styles.statFlex} slideFrom="bottom">
              <GlassCard style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>STREAK</Text>
                  <View style={styles.streakRow}>
                    <StreakFlame days={displayStats.streakDays} />
                  </View>
                </View>
              </GlassCard>
            </FadeInView>
          </View>

          {/* Last Session Card */}
          {displayLastSession && (
            <FadeInView delay={500} slideFrom="bottom">
              <GlassCard
                style={styles.lastSessionCard}
                gold={displayLastSession.is_personal_record}
              >
                <View style={styles.lastSessionContent}>
                  <View style={styles.lastSessionHeader}>
                    <View style={styles.lastSessionTitleRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.text3} />
                      <Text style={styles.lastSessionTitle}>
                        Last Session · {formatTime(displayLastSession.ended_at)}
                      </Text>
                    </View>
                    {displayLastSession.is_personal_record && (
                      <Badge label="RECORD" color="gold" />
                    )}
                  </View>
                  <View style={styles.lastSessionStats}>
                    <View style={styles.lastSessionStat}>
                      <Text style={styles.lastSessionStatValue}>
                        {formatDuration(displayLastSession.duration_seconds)}
                      </Text>
                      <Text style={styles.lastSessionStatLabel}>DURATION</Text>
                    </View>
                    {displayLastSession.weight_delta_lbs != null && (
                      <View style={styles.lastSessionStat}>
                        <AnimatedNumber
                          value={displayLastSession.weight_delta_lbs}
                          decimals={2}
                          duration={600}
                          style={[styles.lastSessionStatValue, styles.lastSessionWeight]}
                          hapticOnComplete
                        />
                        <Text style={styles.lastSessionStatLabel}>LBS</Text>
                      </View>
                    )}
                  </View>
                </View>
              </GlassCard>
            </FadeInView>
          )}

          {/* Motivational Taunt */}
          <FadeInView delay={600} slideFrom="bottom">
            <View style={styles.tauntCard}>
              <Text style={styles.tauntText}>
                {dumpScore >= 9 ? 'You reign supreme. For now.' :
                 dumpScore >= 7 ? 'The throne is within reach. Push harder.' :
                 dumpScore >= 5 ? 'Bobby is watching. Don\'t let him catch up.' :
                 'Every champion started somewhere. Your time is now.'}
              </Text>
            </View>
          </FadeInView>

          {!MOCK_ENABLED && todayStats.sessionCount === 0 && !lastSession && (
            <FadeInView delay={300}>
              <View style={styles.emptyState}>
                <Ionicons name="crown-outline" size={48} color={Colors.goldDim} />
                <Text style={styles.emptyTitle}>Your throne awaits.</Text>
                <Text style={styles.emptySub}>Tap CLAIM THE THRONE to start your first session.</Text>
              </View>
            </FadeInView>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  greeting: {
    gap: 4,
    paddingBottom: 4,
  },
  greetingLabel: {
    ...Type.label,
    color: Colors.text3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingName: {
    fontFamily: Fonts.displayFamily,
    fontSize: 38,
    letterSpacing: -0.5,
    color: Colors.text1,
  },
  crownIcon: {
    fontSize: 28,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    fontFamily: Fonts.displaySemiBoldFamily,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.gold,
  },
  dumpScore: {
    fontFamily: Fonts.monoFamily,
    fontSize: 13,
    color: Colors.text3,
  },
  startButtonWrapper: {
    shadowColor: Colors.gold,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
  },
  startButton: {
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startButtonCenter: {
    flex: 1,
    alignItems: 'center',
  },
  startButtonLabel: {
    fontFamily: Fonts.displayFamily,
    color: '#000',
    fontSize: 20,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  startButtonSub: {
    fontFamily: Fonts.bodyFamily,
    color: 'rgba(0,0,0,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statFlex: {
    flex: 1,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    padding: 14,
    gap: 6,
  },
  statLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
  },
  statValue: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 22,
    color: Colors.text1,
  },
  statValueGold: {
    color: Colors.gold,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSessionCard: {
    marginTop: 4,
  },
  lastSessionContent: {
    padding: 16,
    gap: 12,
  },
  lastSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastSessionTitle: {
    ...Type.label,
    color: Colors.text3,
  },
  lastSessionStats: {
    flexDirection: 'row',
    gap: 24,
  },
  lastSessionStat: {
    gap: 2,
  },
  lastSessionStatValue: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 28,
    color: Colors.text1,
  },
  lastSessionWeight: {
    color: Colors.gold,
  },
  lastSessionStatLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
  },
  tauntCard: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tauntText: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 13,
    color: Colors.text3,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPad: {
    height: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.displayFamily,
    fontSize: 24,
    letterSpacing: -0.5,
    color: Colors.text1,
    textAlign: 'center',
  },
  emptySub: {
    ...Type.body,
    color: Colors.text3,
    textAlign: 'center',
    fontSize: 13,
  },
});
