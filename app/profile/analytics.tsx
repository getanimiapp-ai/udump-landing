import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Polyline, Svg } from 'react-native-svg';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';
import { supabase } from '../../lib/supabase';
import { calculateDumpScore, getDumpScoreInsight } from '../../lib/utils/dumpScore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_RADIUS = 76;
const RING_STROKE = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2 + 4;

interface SessionRow {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  weight_delta_lbs: number | null;
  is_personal_record: boolean | null;
  throne_claimed: boolean | null;
}

interface ThroneRow {
  current_king_id: string | null;
}

interface FactorBreakdown {
  consistency: number;
  weightTrend: number;
  sessionLength: number;
  throneActivity: number;
  consistencyLabel: string;
  weightLabel: string;
  lengthLabel: string;
  throneLabel: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildTrendPoints(sessions: SessionRow[], width: number, height: number): string {
  const sorted = [...sessions]
    .filter((s) => {
      const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000;
      return daysAgo <= 30;
    })
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  if (sorted.length < 2) return '';

  const points: { x: number; y: number }[] = sorted.map((s, i) => {
    const subset = sorted.slice(0, i + 1);
    const score = calculateDumpScore({ sessions: subset, thrones: [], userId: '' });
    return { x: i, y: score };
  });

  const maxX = points.length - 1;
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  const yRange = maxY - minY || 1;
  const pad = 8;

  return points
    .map((p) => {
      const px = pad + (p.x / maxX) * (width - pad * 2);
      const py = pad + (1 - (p.y - minY) / yRange) * (height - pad * 2);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');
}

function computeFactors(
  sessions: SessionRow[],
  thrones: ThroneRow[],
  userId: string,
): FactorBreakdown {
  const last30 = sessions.filter((s) => {
    const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000;
    return daysAgo <= 30;
  });

  const consistency = Math.min((last30.length / 30) * 10, 10);
  const consistencyLabel = `${last30.length}/30 days this month`;

  const recent = sessions.slice(0, 10);
  const avgWeight =
    recent.length > 0
      ? recent.reduce((sum, s) => sum + (s.weight_delta_lbs || 0), 0) / recent.length
      : 0;
  const weightTrend = Math.min(avgWeight * 2.5, 10);
  const weightLabel = `Avg ${avgWeight.toFixed(1)} lbs per session`;

  const avgDuration =
    recent.length > 0
      ? recent.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / recent.length / 60
      : 0;
  let sessionLength: number;
  if (avgDuration < 5) {
    sessionLength = avgDuration * 2;
  } else if (avgDuration <= 30) {
    sessionLength = 10;
  } else if (avgDuration <= 60) {
    sessionLength = Math.max(10 - (avgDuration - 30) * 0.2, 5);
  } else {
    sessionLength = 2;
  }
  const lengthLabel =
    avgDuration < 5
      ? `Avg ${avgDuration.toFixed(0)} min — very fast`
      : avgDuration <= 30
        ? `Avg ${avgDuration.toFixed(0)} min — ideal`
        : `Avg ${avgDuration.toFixed(0)} min — slightly long`;

  const thronesClaimed = thrones.filter((t) => t.current_king_id === userId).length;
  const throneActivity = Math.min(thronesClaimed * 2, 10);
  const throneLabel =
    thronesClaimed === 0
      ? 'No active thrones'
      : `King status: Active (${thronesClaimed} throne${thronesClaimed > 1 ? 's' : ''})`;

  return {
    consistency,
    weightTrend,
    sessionLength,
    throneActivity,
    consistencyLabel,
    weightLabel,
    lengthLabel,
    throneLabel,
  };
}

interface FactorBarProps {
  label: string;
  value: number;
  subtitle: string;
}

function FactorBar({ label, value, subtitle }: FactorBarProps) {
  const pct = Math.min(Math.max((value / 10) * 100, 0), 100);

  return (
    <View style={factorStyles.row}>
      <View style={factorStyles.labelRow}>
        <Text style={factorStyles.label}>{label}</Text>
        <Text style={factorStyles.score}>{value.toFixed(1)}</Text>
      </View>
      <View style={factorStyles.track}>
        <View style={[factorStyles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={factorStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const factorStyles = StyleSheet.create({
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...Type.label,
    color: Colors.text2,
    fontSize: 11,
  },
  score: {
    ...Type.mono,
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '700',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.glass3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  subtitle: {
    ...Type.caption,
    color: Colors.text3,
    fontSize: 10,
  },
});

export default function AnalyticsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [thrones, setThrones] = useState<ThroneRow[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const scoreProgress = useSharedValue(0);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: sessionData }, { data: throneData }] = await Promise.all([
      supabase
        .from('dump_sessions')
        .select(
          'id, started_at, duration_seconds, weight_delta_lbs, is_personal_record, throne_claimed',
        )
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false }),
      supabase.from('thrones').select('current_king_id'),
    ]);

    if (sessionData) setSessions(sessionData);
    if (throneData) setThrones(throneData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dumpScore = calculateDumpScore({ sessions, thrones, userId });
  const insight = getDumpScoreInsight(dumpScore);
  const factors = computeFactors(sessions, thrones, userId);

  useEffect(() => {
    if (!loading) {
      scoreProgress.value = withTiming(dumpScore / 10, { duration: 1200 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, dumpScore]);

  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - scoreProgress.value),
  }));

  const CHART_W = 280;
  const CHART_H = 100;
  const trendPoints = buildTrendPoints(sessions, CHART_W, CHART_H);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dump Score™</Text>
        <Text style={styles.subtitle}>{sessions.length} sessions logged</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {/* Score Ring */}
            <View style={styles.ringContainer}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={Colors.glass3}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={Colors.gold}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                  animatedProps={animatedRingProps}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={styles.scoreValue}>{dumpScore.toFixed(1)}</Text>
                <Text style={styles.scoreMax}>/ 10</Text>
              </View>
            </View>

            {/* Insight */}
            <GlassCard style={styles.insightCard}>
              <Text style={styles.sectionLabel}>INSIGHT</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </GlassCard>

            {/* Trend Chart */}
            {trendPoints.length > 0 && (
              <GlassCard style={styles.chartCard}>
                <Text style={styles.sectionLabel}>30-DAY TREND</Text>
                <Svg width={CHART_W} height={CHART_H}>
                  <Polyline
                    points={trendPoints}
                    fill="none"
                    stroke={Colors.gold}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </GlassCard>
            )}

            {/* Factor Breakdown */}
            <GlassCard style={styles.factorsCard}>
              <Text style={styles.sectionLabel}>FACTOR BREAKDOWN</Text>
              <View style={styles.factorsList}>
                <FactorBar
                  label="Consistency"
                  value={factors.consistency}
                  subtitle={factors.consistencyLabel}
                />
                <FactorBar
                  label="Weight Trend"
                  value={factors.weightTrend}
                  subtitle={factors.weightLabel}
                />
                <FactorBar
                  label="Session Length"
                  value={factors.sessionLength}
                  subtitle={factors.lengthLabel}
                />
                <FactorBar
                  label="Throne Activity"
                  value={factors.throneActivity}
                  subtitle={factors.throneLabel}
                />
              </View>
            </GlassCard>

            <Text style={styles.historyLabel}>SESSION HISTORY</Text>
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.sessionRow}>
            <View style={styles.sessionLeft}>
              <Text style={styles.sessionDate}>
                {formatDistanceToNow(new Date(item.started_at), { addSuffix: true })}
              </Text>
              <Text style={styles.sessionDuration}>{formatDuration(item.duration_seconds)}</Text>
            </View>
            <View style={styles.sessionRight}>
              {item.weight_delta_lbs != null && (
                <Text style={styles.sessionWeight}>{item.weight_delta_lbs.toFixed(2)} lbs</Text>
              )}
              <View style={styles.sessionBadges}>
                {item.is_personal_record && <Text style={styles.sessionBadgePR}>PR</Text>}
                {item.throne_claimed && <Text style={styles.sessionBadgeThrone}>👑</Text>}
              </View>
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No sessions yet. The throne awaits.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<View style={styles.bottomPad} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  backBtn: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  backText: {
    ...Type.body,
    color: Colors.gold,
  },
  title: {
    ...Type.display,
    fontSize: 28,
    color: Colors.text1,
  },
  subtitle: {
    ...Type.caption,
    color: Colors.text3,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 14,
    paddingBottom: 14,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreValue: {
    ...Type.mono,
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text1,
    letterSpacing: -1,
  },
  scoreMax: {
    ...Type.mono,
    fontSize: 14,
    color: Colors.text3,
    marginTop: -4,
  },
  sectionLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 8,
  },
  insightCard: {
    padding: 16,
  },
  insightText: {
    ...Type.body,
    color: Colors.text2,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  chartCard: {
    padding: 16,
  },
  factorsCard: {
    padding: 16,
  },
  factorsList: {
    gap: 16,
  },
  historyLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 4,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  sessionLeft: {
    gap: 3,
  },
  sessionDate: {
    ...Type.caption,
    color: Colors.text2,
    fontSize: 12,
  },
  sessionDuration: {
    ...Type.mono,
    fontSize: 11,
    color: Colors.text3,
  },
  sessionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sessionWeight: {
    ...Type.mono,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  sessionBadgePR: {
    ...Type.label,
    fontSize: 8,
    color: Colors.gold,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sessionBadgeThrone: {
    fontSize: 12,
  },
  separator: {
    height: 8,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...Type.body,
    color: Colors.text3,
    fontStyle: 'italic',
  },
  bottomPad: {
    height: 100,
  },
});
