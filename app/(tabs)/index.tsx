import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Badge } from '../../components/ui/Badge';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatCard } from '../../components/ui/StatCard';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

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

  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
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
          <View style={styles.greeting}>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{profile?.display_name ?? 'Friend'}.</Text>
            <Text style={styles.dumpScore}>
              Dump Score™ {profile?.dump_score.toFixed(1) ?? '—'}
            </Text>
          </View>

          {/* START SESSION Button */}
          <Animated.View style={[styles.startButtonWrapper, pulseStyle]}>
            <TouchableOpacity
              onPress={() => router.push('/session/active')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#C49A20', '#F0CE60']}
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
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard label="TODAY" value={todayStats.sessionCount} />
            <StatCard
              label="WEIGHT"
              value={todayStats.totalWeight.toFixed(1)}
              unit="lbs"
              highlight
            />
            <StatCard
              label="STREAK"
              value={`${todayStats.streakDays}d`}
            />
          </View>

          {/* Last Session Card */}
          {lastSession && (
            <GlassCard style={styles.lastSessionCard}>
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
    ...Type.display,
    fontSize: 34,
    color: Colors.text1,
  },
  dumpScore: {
    ...Type.mono,
    fontSize: 12,
    color: Colors.gold,
  },
  startButtonWrapper: {
    shadowColor: Colors.gold,
    shadowOpacity: 0.4,
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
    color: '#000',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  startButtonSub: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
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
    ...Type.mono,
    fontSize: 24,
    fontWeight: '700',
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
});
