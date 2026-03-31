import { MOCK_ENABLED, MOCK_SESSION_LOG, MOCK_DUMP_SCORE, MOCK_PROFILE } from '../../lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Circle, Polyline, Rect, Svg, Defs, LinearGradient as SvgGradient, Stop, Line } from 'react-native-svg';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { FadeInView } from '../../components/ui/FadeInView';
import { LevelRing } from '../../components/ui/LevelRing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';
import { supabase } from '../../lib/supabase';
import { calculateDumpScore, getDumpScoreInsight } from '../../lib/utils/dumpScore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 80;
const CHART_H = 160;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

function getRankTitle(score: number): string {
  if (score >= 9.5) return 'LEGENDARY';
  if (score >= 9) return 'ELITE';
  if (score >= 8) return 'CHAMPION';
  if (score >= 7) return 'VETERAN';
  if (score >= 5) return 'CONTENDER';
  if (score >= 3) return 'ROOKIE';
  return 'UNRANKED';
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Build weight trend line data
function buildWeightPoints(sessions: SessionRow[], width: number, height: number): string {
  const sorted = [...sessions]
    .filter((s) => s.weight_delta_lbs != null && s.weight_delta_lbs > 0)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
    .slice(-20);

  if (sorted.length < 2) return '';

  const weights = sorted.map((s) => s.weight_delta_lbs!);
  const minY = Math.min(...weights) * 0.8;
  const maxY = Math.max(...weights) * 1.1;
  const yRange = maxY - minY || 1;
  const pad = 12;

  return sorted
    .map((s, i) => {
      const px = pad + (i / (sorted.length - 1)) * (width - pad * 2);
      const py = pad + (1 - (s.weight_delta_lbs! - minY) / yRange) * (height - pad * 2);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');
}

// Build daily session frequency for last 7 days
function buildWeeklyBars(sessions: SessionRow[]): { day: string; count: number; weight: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const result: { day: string; count: number; weight: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const daySessions = sessions.filter((s) => {
      const t = new Date(s.started_at).getTime();
      return t >= d.getTime() && t < nextDay.getTime();
    });

    result.push({
      day: days[d.getDay()],
      count: daySessions.length,
      weight: daySessions.reduce((sum, s) => sum + (s.weight_delta_lbs ?? 0), 0),
    });
  }

  return result;
}

function computeFactors(sessions: SessionRow[], thrones: ThroneRow[], userId: string) {
  const last30 = sessions.filter((s) => {
    const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000;
    return daysAgo <= 30;
  });

  const consistency = Math.min((last30.length / 30) * 10, 10);
  const consistencyLabel = `${last30.length}/30 days this month`;

  const recent = sessions.slice(0, 10);
  const avgWeight = recent.length > 0
    ? recent.reduce((sum, s) => sum + (s.weight_delta_lbs || 0), 0) / recent.length
    : 0;
  const weightTrend = Math.min(avgWeight * 2.5, 10);
  const weightLabel = `Avg ${avgWeight.toFixed(1)} lbs per session`;

  const avgDuration = recent.length > 0
    ? recent.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / recent.length / 60
    : 0;
  let sessionLength: number;
  if (avgDuration < 5) sessionLength = avgDuration * 2;
  else if (avgDuration <= 30) sessionLength = 10;
  else if (avgDuration <= 60) sessionLength = Math.max(10 - (avgDuration - 30) * 0.2, 5);
  else sessionLength = 2;
  const lengthLabel = avgDuration <= 5 ? `Avg ${avgDuration.toFixed(0)} min` : avgDuration <= 30 ? `Avg ${avgDuration.toFixed(0)} min (ideal)` : `Avg ${avgDuration.toFixed(0)} min`;

  const thronesClaimed = thrones.filter((t) => t.current_king_id === userId).length;
  const throneActivity = Math.min(thronesClaimed * 2, 10);
  const throneLabel = thronesClaimed === 0 ? 'No active thrones' : `${thronesClaimed} throne${thronesClaimed > 1 ? 's' : ''} held`;

  return { consistency, weightTrend, sessionLength, throneActivity, consistencyLabel, weightLabel, lengthLabel, throneLabel };
}

function AnimatedFactorBar({ label, value, subtitle, delay = 0 }: { label: string; value: number; subtitle: string; delay?: number }) {
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withDelay(delay, withTiming(Math.min((value / 10) * 100, 100), { duration: 800, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  return (
    <View style={factorStyles.row}>
      <View style={factorStyles.labelRow}>
        <Text style={factorStyles.label}>{label}</Text>
        <AnimatedNumber value={value} decimals={1} style={factorStyles.score} duration={800} />
      </View>
      <View style={factorStyles.track}>
        <Animated.View style={[factorStyles.fill, barStyle]} />
      </View>
      <Text style={factorStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const factorStyles = StyleSheet.create({
  row: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: Fonts.bodySemiBoldFamily, fontSize: 12, color: Colors.text2, letterSpacing: 0.5 },
  score: { fontFamily: Fonts.monoMediumFamily, fontSize: 13, color: Colors.gold },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.glass3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: Colors.gold },
  subtitle: { fontFamily: Fonts.bodyFamily, fontSize: 11, color: Colors.text3 },
});

export default function AnalyticsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [thrones, setThrones] = useState<ThroneRow[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (MOCK_ENABLED) {
      const mockSessions: SessionRow[] = MOCK_SESSION_LOG.map((s) => ({
        id: s.id,
        started_at: s.started_at,
        duration_seconds: s.duration_seconds,
        weight_delta_lbs: s.weight_delta_lbs,
        is_personal_record: s.is_personal_record,
        throne_claimed: s.throne_claimed,
      }));
      setSessions(mockSessions);
      setThrones([
        { current_king_id: 'mock-aaron' },
        { current_king_id: 'mock-aaron' },
        { current_king_id: 'mock-nick' },
      ]);
      setUserId('mock-aaron');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: sessionData }, { data: throneData }] = await Promise.all([
      supabase
        .from('dump_sessions')
        .select('id, started_at, duration_seconds, weight_delta_lbs, is_personal_record, throne_claimed')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false }),
      supabase.from('thrones').select('current_king_id'),
    ]);

    if (sessionData) setSessions(sessionData);
    if (throneData) setThrones(throneData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dumpScore = calculateDumpScore({ sessions, thrones, userId });
  const insight = getDumpScoreInsight(dumpScore);
  const factors = computeFactors(sessions, thrones, userId);
  const weeklyBars = buildWeeklyBars(sessions);
  const weightPoints = buildWeightPoints(sessions, CHART_W, CHART_H);
  const maxBarCount = Math.max(...weeklyBars.map((b) => b.count), 1);

  // Stats
  const totalSessions = sessions.length;
  const totalWeight = sessions.reduce((sum, s) => sum + (s.weight_delta_lbs ?? 0), 0);
  const totalRecords = sessions.filter((s) => s.is_personal_record).length;
  const totalThrones = sessions.filter((s) => s.throne_claimed).length;
  const bestSession = sessions.reduce((best, s) =>
    (s.weight_delta_lbs ?? 0) > (best?.weight_delta_lbs ?? 0) ? s : best,
    sessions[0]
  );
  const longestSession = sessions.reduce((best, s) =>
    (s.duration_seconds ?? 0) > (best?.duration_seconds ?? 0) ? s : best,
    sessions[0]
  );

  const nextRank = dumpScore >= 9.5 ? 10 : dumpScore >= 9 ? 9.5 : dumpScore >= 8 ? 9 : dumpScore >= 7 ? 8 : dumpScore >= 5 ? 7 : dumpScore >= 3 ? 5 : 3;
  const prevRank = dumpScore >= 9.5 ? 9.5 : dumpScore >= 9 ? 9 : dumpScore >= 8 ? 8 : dumpScore >= 7 ? 7 : dumpScore >= 5 ? 5 : dumpScore >= 3 ? 3 : 0;
  const rankProgress = nextRank === prevRank ? 1 : (dumpScore - prevRank) / (nextRank - prevRank);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Score Ring */}
        <FadeInView delay={0}>
          <View style={styles.scoreHero}>
            <LevelRing progress={rankProgress} size={220} strokeWidth={5}>
              <View style={styles.scoreCenter}>
                <AnimatedNumber
                  value={dumpScore}
                  decimals={1}
                  duration={1200}
                  style={styles.scoreValue}
                  hapticOnComplete
                  bounce
                />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{getRankTitle(dumpScore)}</Text>
                </View>
              </View>
            </LevelRing>
            <Text style={styles.scoreSubtitle}>Dump Score\u2122</Text>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        </FadeInView>

        {/* Quick Stats Grid */}
        <FadeInView delay={100}>
          <View style={styles.statsGrid}>
            <GlassCard style={styles.statCell}>
              <View style={styles.statCellContent}>
                <Ionicons name="flash" size={18} color={Colors.gold} />
                <AnimatedNumber value={totalSessions} style={styles.statBigNum} hapticOnComplete />
                <Text style={styles.statCellLabel}>SESSIONS</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.statCell}>
              <View style={styles.statCellContent}>
                <Ionicons name="scale-outline" size={18} color={Colors.gold} />
                <AnimatedNumber value={totalWeight} decimals={1} style={styles.statBigNum} hapticOnComplete />
                <Text style={styles.statCellLabel}>TOTAL LBS</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.statCell}>
              <View style={styles.statCellContent}>
                <Ionicons name="trophy" size={18} color={Colors.gold} />
                <AnimatedNumber value={totalRecords} style={styles.statBigNum} hapticOnComplete />
                <Text style={styles.statCellLabel}>RECORDS</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.statCell}>
              <View style={styles.statCellContent}>
                <Text style={{ fontSize: 18 }}>👑</Text>
                <AnimatedNumber value={totalThrones} style={styles.statBigNum} hapticOnComplete />
                <Text style={styles.statCellLabel}>THRONES</Text>
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        {/* Weight Trend Chart */}
        {weightPoints.length > 0 && (
          <FadeInView delay={200}>
            <GlassCard style={styles.chartCard}>
              <View style={styles.chartContent}>
                <View style={styles.chartHeader}>
                  <Ionicons name="trending-up" size={16} color={Colors.gold} />
                  <Text style={styles.chartTitle}>WEIGHT TREND</Text>
                </View>
                <Svg width={CHART_W} height={CHART_H}>
                  <Defs>
                    <SvgGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor={Colors.gold} stopOpacity="0.4" />
                      <Stop offset="0.5" stopColor={Colors.goldBright} stopOpacity="1" />
                      <Stop offset="1" stopColor={Colors.gold} stopOpacity="0.6" />
                    </SvgGradient>
                  </Defs>
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map((pct) => (
                    <Line
                      key={pct}
                      x1={12}
                      y1={12 + pct * (CHART_H - 24)}
                      x2={CHART_W - 12}
                      y2={12 + pct * (CHART_H - 24)}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={1}
                    />
                  ))}
                  <Polyline
                    points={weightPoints}
                    fill="none"
                    stroke="url(#chartLine)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.chartCaption}>Last 20 sessions with weight data</Text>
              </View>
            </GlassCard>
          </FadeInView>
        )}

        {/* Weekly Activity Bar Chart */}
        <FadeInView delay={300}>
          <GlassCard style={styles.chartCard}>
            <View style={styles.chartContent}>
              <View style={styles.chartHeader}>
                <Ionicons name="bar-chart-outline" size={16} color={Colors.gold} />
                <Text style={styles.chartTitle}>THIS WEEK</Text>
              </View>
              <View style={styles.barChart}>
                {weeklyBars.map((bar, i) => {
                  const barHeight = maxBarCount > 0 ? (bar.count / maxBarCount) * 80 : 0;
                  const isToday = i === 6;
                  return (
                    <View key={bar.day} style={styles.barColumn}>
                      <Text style={[styles.barCount, bar.count > 0 && styles.barCountActive]}>
                        {bar.count > 0 ? bar.count : ''}
                      </Text>
                      <View style={styles.barTrack}>
                        <LinearGradient
                          colors={isToday ? [Colors.goldBright, Colors.gold] : ['rgba(212,175,55,0.5)', 'rgba(212,175,55,0.3)']}
                          style={[styles.barFill, { height: Math.max(barHeight, bar.count > 0 ? 4 : 0) }]}
                        />
                      </View>
                      <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{bar.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        {/* Personal Bests */}
        <FadeInView delay={400}>
          <GlassCard style={styles.bestsCard}>
            <View style={styles.bestsContent}>
              <View style={styles.chartHeader}>
                <Ionicons name="medal-outline" size={16} color={Colors.gold} />
                <Text style={styles.chartTitle}>PERSONAL BESTS</Text>
              </View>
              <View style={styles.bestsGrid}>
                <View style={styles.bestItem}>
                  <Text style={styles.bestLabel}>HEAVIEST DROP</Text>
                  <Text style={styles.bestValue}>
                    {bestSession?.weight_delta_lbs ? `${bestSession.weight_delta_lbs.toFixed(2)} lbs` : '--'}
                  </Text>
                </View>
                <View style={styles.bestItem}>
                  <Text style={styles.bestLabel}>LONGEST SESSION</Text>
                  <Text style={styles.bestValue}>
                    {formatDuration(longestSession?.duration_seconds ?? null)}
                  </Text>
                </View>
                <View style={styles.bestItem}>
                  <Text style={styles.bestLabel}>BEST STREAK</Text>
                  <Text style={styles.bestValue}>
                    {MOCK_ENABLED ? '14 days' : '--'}
                  </Text>
                </View>
                <View style={styles.bestItem}>
                  <Text style={styles.bestLabel}>THRONES HELD</Text>
                  <Text style={styles.bestValue}>
                    {thrones.filter((t) => t.current_king_id === userId).length}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        {/* Factor Breakdown */}
        <FadeInView delay={500}>
          <GlassCard style={styles.factorsCard}>
            <View style={styles.factorsContent}>
              <View style={styles.chartHeader}>
                <Ionicons name="pie-chart-outline" size={16} color={Colors.gold} />
                <Text style={styles.chartTitle}>SCORE BREAKDOWN</Text>
              </View>
              <View style={styles.factorsList}>
                <AnimatedFactorBar label="Consistency" value={factors.consistency} subtitle={factors.consistencyLabel} delay={600} />
                <AnimatedFactorBar label="Weight Trend" value={factors.weightTrend} subtitle={factors.weightLabel} delay={700} />
                <AnimatedFactorBar label="Session Length" value={factors.sessionLength} subtitle={factors.lengthLabel} delay={800} />
                <AnimatedFactorBar label="Throne Activity" value={factors.throneActivity} subtitle={factors.throneLabel} delay={900} />
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        {/* Recent Sessions */}
        <FadeInView delay={600}>
          <Text style={styles.historyLabel}>RECENT SESSIONS</Text>
        </FadeInView>
        {sessions.slice(0, 15).map((item, i) => (
          <FadeInView key={item.id} delay={700 + i * 40} slideDistance={10}>
            <GlassCard
              style={styles.sessionRow}
              gold={item.is_personal_record === true}
            >
              <View style={styles.sessionContent}>
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
                    {item.is_personal_record && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prText}>PR</Text>
                      </View>
                    )}
                    {item.throne_claimed && <Text style={styles.sessionBadgeThrone}>👑</Text>}
                  </View>
                </View>
              </View>
            </GlassCard>
          </FadeInView>
        ))}

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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  backText: {
    ...Type.body,
    color: Colors.gold,
  },
  title: {
    fontFamily: Fonts.displayFamily,
    fontSize: 32,
    letterSpacing: -0.5,
    color: Colors.text1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  scoreHero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  scoreCenter: {
    alignItems: 'center',
    gap: 6,
  },
  scoreValue: {
    fontFamily: Fonts.monoFamily,
    fontSize: 52,
    color: Colors.gold,
    lineHeight: 58,
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
    ...Type.label,
    color: Colors.text3,
    letterSpacing: 2,
  },
  insightText: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 13,
    color: Colors.text2,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCell: {
    width: (SCREEN_WIDTH - 50) / 2,
  },
  statCellContent: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statBigNum: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 28,
    color: Colors.text1,
  },
  statCellLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  chartCard: {},
  chartContent: {
    padding: 18,
    gap: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
    letterSpacing: 2,
  },
  chartCaption: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barCount: {
    fontFamily: Fonts.monoFamily,
    fontSize: 10,
    color: 'transparent',
    height: 14,
  },
  barCountActive: {
    color: Colors.text3,
  },
  barTrack: {
    width: 20,
    height: 80,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.glass1,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: 0.5,
  },
  barLabelToday: {
    color: Colors.gold,
  },
  bestsCard: {},
  bestsContent: {
    padding: 18,
    gap: 14,
  },
  bestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  bestItem: {
    width: '45%',
    gap: 4,
  },
  bestLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
  },
  bestValue: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 18,
    color: Colors.text1,
  },
  factorsCard: {},
  factorsContent: {
    padding: 18,
    gap: 14,
  },
  factorsList: {
    gap: 16,
  },
  historyLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
    letterSpacing: 2,
  },
  sessionRow: {
    overflow: 'hidden',
  },
  sessionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  sessionLeft: {
    gap: 3,
  },
  sessionDate: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 12,
    color: Colors.text2,
  },
  sessionDuration: {
    fontFamily: Fonts.monoFamily,
    fontSize: 11,
    color: Colors.text3,
  },
  sessionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sessionWeight: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 15,
    color: Colors.gold,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  prBadge: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  prText: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.gold,
  },
  sessionBadgeThrone: {
    fontSize: 12,
  },
  bottomPad: {
    height: 100,
  },
});
