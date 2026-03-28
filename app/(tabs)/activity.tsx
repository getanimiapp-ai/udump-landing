import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { calculateDumpScore, getDumpScoreInsight } from '@/lib/utils/dumpScore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

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

function FactorBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={factorStyles.container}>
      <View style={factorStyles.labelRow}>
        <Text style={factorStyles.label}>{label}</Text>
        <Text style={factorStyles.value}>{value.toFixed(1)}</Text>
      </View>
      <View style={factorStyles.track}>
        <View style={[factorStyles.fill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

const factorStyles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...Type.label, color: Colors.text3, fontSize: 10 },
  value: { ...Type.mono, fontSize: 12, color: Colors.text1, fontWeight: '700' },
  track: {
    height: 4,
    backgroundColor: Colors.glass2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
});

export default function ActivityScreen() {
  const { profile } = useUserStore();
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [score, setScore] = useState(profile?.dump_score ?? 0);
  const [factors, setFactors] = useState<ScoreFactors>({ consistency: 0, weight: 0, length: 0, throne: 0 });
  const [insight, setInsight] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
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

    // Calculate factors
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
    setRefreshing(false);
  }, [fetchData]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Header */}
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>DUMP SCORE™</Text>
          <Text style={styles.scoreValue}>{score.toFixed(1)}</Text>
          <Text style={styles.scoreSubtitle}>
            {score >= 9 ? 'Top 5% globally' : score >= 7 ? 'Top 20% globally' : score >= 5 ? 'Top 50% globally' : 'Below average globally'}
          </Text>
        </View>

        {/* Factor Breakdown */}
        <GlassCard style={styles.factorsCard}>
          <View style={styles.factorsContent}>
            <Text style={styles.sectionLabel}>SCORE BREAKDOWN</Text>
            <FactorBar label="Consistency" value={factors.consistency} />
            <FactorBar label="Weight Trend" value={factors.weight} />
            <FactorBar label="Session Length" value={factors.length} />
            <FactorBar label="Throne Activity" value={factors.throne} />
          </View>
        </GlassCard>

        {/* Insight */}
        {insight && (
          <GlassCard>
            <View style={styles.insightContent}>
              <Text style={styles.sectionLabel}>INSIGHT</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          </GlassCard>
        )}

        {/* Session Log */}
        <Text style={styles.logTitle}>DUMP LOG</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sessions recorded yet.</Text>
            <Text style={styles.emptySub}>Champions start somewhere.</Text>
          </View>
        ) : (
          sessions.map((s) => (
            <GlassCard key={s.id} style={styles.logItem}>
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
    gap: 6,
  },
  scoreLabel: {
    ...Type.label,
    color: Colors.text3,
  },
  scoreValue: {
    ...Type.mono,
    fontSize: 64,
    fontWeight: '700',
    color: Colors.gold,
    lineHeight: 72,
  },
  scoreSubtitle: {
    ...Type.caption,
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
    ...Type.body,
    color: Colors.text2,
    fontWeight: '600',
    fontSize: 14,
  },
  logTime: {
    ...Type.caption,
    color: Colors.text3,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  logDuration: {
    ...Type.mono,
    fontSize: 14,
    color: Colors.text1,
    fontWeight: '600',
  },
  logWeight: {
    ...Type.mono,
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
    ...Type.display,
    fontSize: 20,
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
