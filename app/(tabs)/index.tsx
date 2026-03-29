import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { Ionicons } from '@expo/vector-icons';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Badge } from '../../components/ui/Badge';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatCard } from '../../components/ui/StatCard';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
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

  const glowOpacity = useSharedValue(0.3);
  const greetingOpacity = useSharedValue(0);
  const stat0Opacity = useSharedValue(0);
  const stat1Opacity = useSharedValue(0);
  const stat2Opacity = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1,
      true
    );
    greetingOpacity.value = withTiming(1, { duration: 500 });
    stat0Opacity.value = withDelay(0, withTiming(1, { duration: 400 }));
    stat1Opacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    stat2Opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));
  const greetingStyle = useAnimatedStyle(() => ({ opacity: greetingOpacity.value }));
  const stat0Style = useAnimatedStyle(() => ({ opacity: stat0Opacity.value }));
  const stat1Style = useAnimatedStyle(() => ({ opacity: stat1Opacity.value }));
  const stat2Style = useAnimatedStyle(() => ({ opacity: stat2Opacity.value }));

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
          {/* Greeting */}
          <Animated.View style={[styles.greeting, greetingStyle]}>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{profile?.display_name ?? 'Friend'}.</Text>
            <Text style={styles.dumpScore}>
              Dump Score™ {profile?.dump_score.toFixed(1) ?? '—'}
            </Text>
          </Animated.View>

          {/* START SESSION Button — glow pulses, button stays steady */}
          <Animated.View style={[styles.startButtonWrapper, glowStyle]}>
            <PressScale onPress={() => router.push('/session/pre')}>
              <LinearGradient
                colors={['#D4AF37', '#F0CE60']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButton}
              >
                <View style={styles.startButtonContent}>
                  <View style={styles.startButtonLeft}>
                    <View style={[styles.statusDot, styles.statusDotManual]} />
                  </View>
                  <View style={styles.startButtonCenter}>
                    <Text style={styles.startButtonLabel}>BEGIN SESSION</Text>
                    <Text style={styles.startButtonSub}>Manual entry mode</Text>
                  </View>
                </View>
              </LinearGradient>
            </PressScale>
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Animated.View style={[styles.statFlex, stat0Style]}>
              <StatCard label="TODAY" value={todayStats.sessionCount} />
            </Animated.View>
            <Animated.View style={[styles.statFlex, stat1Style]}>
              <StatCard
                label="WEIGHT"
                value={todayStats.totalWeight.toFixed(1)}
                unit="lbs"
                highlight
              />
            </Animated.View>
            <Animated.View style={[styles.statFlex, stat2Style]}>
              <StatCard
                label="STREAK"
                value={`${todayStats.streakDays}d`}
              />
            </Animated.View>
          </View>

          {/* Last Session Card */}
          {lastSession && (
            <GlassCard
              style={styles.lastSessionCard}
              gold={lastSession.is_personal_record}
            >
              <View style={styles.lastSessionContent}>
                <View style={styles.lastSessionHeader}>
                  <Text style={styles.lastSessionTitle}>
                    Last Session · {formatTime(lastSession.ended_at)}
                  </Text>
                  {lastSession.is_personal_record && (
                    <Badge label="RECORD" color="gold" />
                  )}
                </View>
                <View style={styles.lastSessionStats}>
                  <View style={styles.lastSessionStat}>
                    <Text style={styles.lastSessionStatValue}>
                      {formatDuration(lastSession.duration_seconds)}
                    </Text>
                    <Text style={styles.lastSessionStatLabel}>DURATION</Text>
                  </View>
                  {lastSession.weight_delta_lbs != null && (
                    <View style={styles.lastSessionStat}>
                      <Text style={[styles.lastSessionStatValue, styles.lastSessionWeight]}>
                        {lastSession.weight_delta_lbs.toFixed(2)}
                      </Text>
                      <Text style={styles.lastSessionStatLabel}>LBS</Text>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          )}

          {todayStats.sessionCount === 0 && !lastSession && (
            <View style={styles.emptyState}>
              <Ionicons name="crown-outline" size={48} color={Colors.goldDim} />
              <Text style={styles.emptyTitle}>Your throne awaits.</Text>
              <Text style={styles.emptySub}>Tap BEGIN SESSION to start your first session.</Text>
            </View>
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
  greetingName: {
    fontFamily: Fonts.displayFamily,
    fontSize: 38,
    letterSpacing: -0.5,
    color: Colors.text1,
  },
  dumpScore: {
    fontFamily: Fonts.monoFamily,
    fontSize: 13,
    color: Colors.gold,
  },
  startButtonWrapper: {
    shadowColor: Colors.gold,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  startButton: {
    height: 66,
    borderRadius: 18,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startButtonLeft: {
    width: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotManual: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusDotConnected: {
    backgroundColor: Colors.green,
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
