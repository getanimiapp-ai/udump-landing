import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { calculateDumpScore, getDumpScoreInsight } from '@/lib/utils/dumpScore';
import { MOCK_ENABLED, MOCK_DUMP_SCORE, MOCK_SESSION_LOG } from '../../lib/mock-data';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { FadeInView } from '../../components/ui/FadeInView';
import { LevelRing } from '../../components/ui/LevelRing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

interface SessionLog {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  weight_delta_lbs: number | null;
  throne_claimed: boolean;
  throneName?: string | null;
}

interface ScoreFactors {
  consistency: number;
  weight: number;
  length: number;
  throne: number;
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

function getNextRankScore(score: number): number {
  if (score >= 9.5) return 10;
  if (score >= 9) return 9.5;
  if (score >= 8) return 9;
  if (score >= 7) return 8;
  if (score >= 5) return 7;
  if (score >= 3) return 5;
  return 3;
}

function FactorBar({ label, value, max = 10, delay = 0 }: { label: string; value: number; max?: number; delay?: number }) {
  const pct = Math.min(value / max, 1);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(pct * 100, { duration: 800, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={factorStyles.container}>
      <View style={factorStyles.labelRow}>
        <Text style={factorStyles.label}>{label}</Text>
        <AnimatedNumber value={value} decimals={1} style={factorStyles.value} duration={800} />
      </View>
      <View style={factorStyles.track}>
        <Animated.View style={[factorStyles.fill, barStyle]} />
      </View>
    </View>
  );
}

const factorStyles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: Fonts.bodySemiBoldFamily, fontSize: 13, color: Colors.text3 },
  value: { fontFamily: Fonts.monoMediumFamily, fontSize: 13, color: Colors.gold },
  track: {
    height: 6,
    backgroundColor: Colors.glass2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
});

export default function ActivityScreen() {
  const { profile } = useUserStore();
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [score, setScore] = useState(profile?.dump_score ?? 0);
  const [factors, setFactors] = useState<ScoreFactors>({ consistency: 0, weight: 0, length: 0, throne: 0 });
  const [insight, setInsight] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (MOCK_ENABLED) {
      const mockSessions: SessionLog[] = MOCK_SESSION_LOG.map((s) => ({
        id: s.id,
        started_at: s.started_at,
        duration_seconds: s.duration_seconds,
        weight_delta_lbs: s.weight_delta_lbs,
        throne_claimed: false,
        throneName: null,
      }));
      setSessions(mockSessions);
      setScore(MOCK_DUMP_SCORE.overall);
      setFactors({
        consistency: MOCK_DUMP_SCORE.factors.consistency,
        weight: MOCK_DUMP_SCORE.factors.weightTrend,
        length: MOCK_DUMP_SCORE.factors.sessionLength,
        throne: MOCK_DUMP_SCORE.factors.throneActivity,
      });
      setInsight(MOCK_DUMP_SCORE.insight);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (MOCK_ENABLED) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rawSessions } = await supabase
      .from('dump_sessions')
      .select('id, started_at, duration_seconds, weight_delta_lbs, throne_claimed, throne_id, thrones(name)')
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(60);

    const { data: thrones } = await supabase
      .from('thrones')
      .select('current_king_id')
      .eq('owner_user_id', user.id);

    if (!rawSessions) return;

    const sessionList: SessionLog[] = rawSessions.map((s) => ({
      id: s.id,
      started_at: s.started_at,
      duration_seconds: s.duration_seconds,
      weight_delta_lbs: s.weight_delta_lbs,
      throne_claimed: s.throne_claimed,
      throneName: (s.thrones as { name: string } | null)?.name ?? null,
    }));

    setSessions(sessionList);

    const calcScore = calculateDumpScore({
      sessions: sessionList,
      thrones: thrones ?? [],
      userId: user.id,
    });
    setScore(calcScore);
    setInsight(getDumpScoreInsight(calcScore));

    const last30 = sessionList.filter((s) => {
      const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000;
      return daysAgo <= 30;
    });
    const recent10 = sessionList.slice(0, 10);
    const avgWeight = recent10.reduce((sum, s) => sum + (s.weight_delta_lbs ?? 0), 0) / (recent10.length || 1);
    const avgDuration = recent10.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / (recent10.length || 1) / 60;
    const throneCount = (thrones ?? []).filter((t) => t.current_king_id === user.id).length;

    setFactors({
      consistency: Math.min((last30.length / 30) * 10, 10),
      weight: Math.min(avgWeight * 2.5, 10),
      length: avgDuration < 5 ? avgDuration * 2 : avgDuration <= 30 ? 10 : avgDuration <= 60 ? Math.max(10 - (avgDuration - 30) * 0.2, 5) : 2,
      throne: Math.min(throneCount * 2, 10),
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRefreshing(false);
  }, [fetchData]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const nextRank = getNextRankScore(score);
  const prevRank = score >= 9.5 ? 9.5 : score >= 9 ? 9 : score >= 8 ? 8 : score >= 7 ? 7 : score >= 5 ? 5 : score >= 3 ? 3 : 0;
  const rankProgress = nextRank === prevRank ? 1 : (score - prevRank) / (nextRank - prevRank);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Hero with Level Ring */}
        <FadeInView delay={0}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>DUMP SCORE\u2122</Text>
            <LevelRing progress={rankProgress} size={200} strokeWidth={4}>
              <View style={styles.scoreCenter}>
                <AnimatedNumber
                  value={score}
                  decimals={1}
                  duration={1000}
                  style={styles.scoreValue}
                  hapticOnComplete
                  bounce
                />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{getRankTitle(score)}</Text>
                </View>
              </View>
            </LevelRing>
            <Text style={styles.scoreSubtitle}>
              {score >= 9 ? 'Top 5% globally' : score >= 7 ? 'Top 20% globally' : score >= 5 ? 'Top 50% globally' : 'Keep grinding, champion'}
            </Text>
          </View>
        </FadeInView>

        {/* Factor Breakdown with animated bars */}
        <FadeInView delay={200}>
          <GlassCard style={styles.factorsCard}>
            <View style={styles.factorsContent}>
              <Text style={styles.sectionLabel}>SCORE BREAKDOWN</Text>
              <FactorBar label="Consistency" value={factors.consistency} delay={300} />
              <FactorBar label="Weight Trend" value={factors.weight} delay={400} />
              <FactorBar label="Session Length" value={factors.length} delay={500} />
              <FactorBar label="Throne Activity" value={factors.throne} delay={600} />
            </View>
          </GlassCard>
        </FadeInView>

        {/* Insight */}
        {insight && (
          <FadeInView delay={400}>
            <GlassCard>
              <View style={styles.insightContent}>
                <Text style={styles.sectionLabel}>INSIGHT</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            </GlassCard>
          </FadeInView>
        )}

        {/* Session Log */}
        <FadeInView delay={500}>
          <Text style={styles.logTitle}>DUMP LOG</Text>
        </FadeInView>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sessions recorded yet.</Text>
            <Text style={styles.emptySub}>Champions start somewhere.</Text>
          </View>
        ) : (
          sessions.map((s, i) => (
            <FadeInView key={s.id} delay={600 + i * 60} slideDistance={12}>
              <GlassCard style={styles.logItem}>
                <View style={styles.logContent}>
                  <View style={styles.logLeft}>
                    <Text style={styles.logDate}>{formatDate(s.started_at)}</Text>
                    <Text style={styles.logTime}>{formatTime(s.started_at)}</Text>
                  </View>
                  <View style={styles.logRight}>
                    {s.duration_seconds != null && (
                      <Text style={styles.logDuration}>{formatDuration(s.duration_seconds)}</Text>
                    )}
                    {s.weight_delta_lbs != null && s.weight_delta_lbs > 0 && (
                      <Text style={styles.logWeight}>{s.weight_delta_lbs.toFixed(2)} lbs</Text>
                    )}
                  </View>
                </View>
              </GlassCard>
            </FadeInView>
          ))
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  scoreHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  scoreLabel: {
    ...Type.label,
    color: Colors.text3,
    letterSpacing: 2,
  },
  scoreCenter: {
    alignItems: 'center',
    gap: 6,
  },
  scoreValue: {
    fontFamily: Fonts.monoFamily,
    fontSize: 56,
    color: Colors.gold,
    lineHeight: 62,
  },
  rankBadge: {
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  rankText: {
    fontFamily: Fonts.displaySemiBoldFamily,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.gold,
  },
  scoreSubtitle: {
    fontFamily: Fonts.monoFamily,
    fontSize: 13,
    color: Colors.text3,
  },
  factorsCard: {},
  factorsContent: {
    padding: 20,
    gap: 14,
  },
  sectionLabel: {
    ...Type.label,
    color: Colors.text3,
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  insightContent: {
    padding: 20,
    gap: 8,
  },
  insightText: {
    ...Type.body,
    color: Colors.text2,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  logTitle: {
    ...Type.label,
    color: Colors.text3,
    marginTop: 4,
    letterSpacing: 1.5,
  },
  logItem: {
    marginBottom: 0,
  },
  logContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  logLeft: {
    gap: 2,
  },
  logDate: {
    fontFamily: Fonts.displayFamily,
    fontSize: 14,
    letterSpacing: -0.3,
    color: Colors.text2,
  },
  logTime: {
    fontFamily: Fonts.monoFamily,
    fontSize: 11,
    color: Colors.text3,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  logDuration: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 14,
    color: Colors.text1,
  },
  logWeight: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 13,
    color: Colors.gold,
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
    fontSize: 20,
    letterSpacing: -0.3,
    color: Colors.text2,
    textAlign: 'center',
  },
  emptySub: {
    ...Type.body,
    color: Colors.text3,
    textAlign: 'center',
    fontSize: 13,
  },
});
