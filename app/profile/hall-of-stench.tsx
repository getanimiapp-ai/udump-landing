import { MOCK_ENABLED } from '../../lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { FadeInView } from '../../components/ui/FadeInView';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

// ── Types ───────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  value: number;
  formattedValue: string;
}

interface LeaderboardCategory {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  unit: string;
  entries: LeaderboardEntry[];
}

// ── Mock Data ───────────────────────────────────────────────────────────

const MOCK_HALL_DATA: LeaderboardCategory[] = [
  {
    key: 'heaviest',
    title: 'Heaviest Single Drop',
    icon: 'barbell-outline',
    unit: 'lbs',
    entries: [
      { rank: 1, username: 'nick_throne', displayName: 'Nick', value: 6.2, formattedValue: '6.2 lbs' },
      { rank: 2, username: 'big_mike_42', displayName: 'Big Mike', value: 5.8, formattedValue: '5.8 lbs' },
      { rank: 3, username: 'aaron_dumps', displayName: 'Aaron', value: 4.1, formattedValue: '4.1 lbs' },
      { rank: 4, username: 'garret_g', displayName: 'Garret', value: 3.9, formattedValue: '3.9 lbs' },
      { rank: 5, username: 'bobby_b', displayName: 'Bobby', value: 0.3, formattedValue: '0.3 lbs' },
    ],
  },
  {
    key: 'longest_session',
    title: 'Longest Session',
    icon: 'time-outline',
    unit: '',
    entries: [
      { rank: 1, username: 'garret_g', displayName: 'Garret', value: 7200, formattedValue: '2h 0m' },
      { rank: 2, username: 'toilet_king_99', displayName: 'ToiletKing', value: 6480, formattedValue: '1h 48m' },
      { rank: 3, username: 'jake_j', displayName: 'Jake', value: 5400, formattedValue: '1h 30m' },
      { rank: 4, username: 'aaron_dumps', displayName: 'Aaron', value: 3180, formattedValue: '53m' },
      { rank: 5, username: 'bobby_b', displayName: 'Bobby', value: 180, formattedValue: '3m' },
    ],
  },
  {
    key: 'thrones_claimed',
    title: 'Most Thrones Claimed',
    icon: 'flag-outline',
    unit: '',
    entries: [
      { rank: 1, username: 'aaron_dumps', displayName: 'Aaron', value: 47, formattedValue: '47 thrones' },
      { rank: 2, username: 'nick_throne', displayName: 'Nick', value: 41, formattedValue: '41 thrones' },
      { rank: 3, username: 'shelden_s', displayName: 'Shelden', value: 28, formattedValue: '28 thrones' },
      { rank: 4, username: 'throne_sniper', displayName: 'ThroneSniper', value: 22, formattedValue: '22 thrones' },
      { rank: 5, username: 'bobby_b', displayName: 'Bobby', value: 0, formattedValue: '0 thrones' },
    ],
  },
  {
    key: 'dump_score',
    title: 'Highest Dump Score',
    icon: 'diamond-outline',
    unit: '',
    entries: [
      { rank: 1, username: 'nick_throne', displayName: 'Nick', value: 9.6, formattedValue: '9.6' },
      { rank: 2, username: 'aaron_dumps', displayName: 'Aaron', value: 9.2, formattedValue: '9.2' },
      { rank: 3, username: 'garret_g', displayName: 'Garret', value: 8.4, formattedValue: '8.4' },
      { rank: 4, username: 'big_mike_42', displayName: 'Big Mike', value: 8.1, formattedValue: '8.1' },
      { rank: 5, username: 'bobby_b', displayName: 'Bobby', value: 1.3, formattedValue: '1.3' },
    ],
  },
  {
    key: 'longest_streak',
    title: 'Longest Streak',
    icon: 'flame-outline',
    unit: 'days',
    entries: [
      { rank: 1, username: 'toilet_king_99', displayName: 'ToiletKing', value: 182, formattedValue: '182 days' },
      { rank: 2, username: 'nick_throne', displayName: 'Nick', value: 91, formattedValue: '91 days' },
      { rank: 3, username: 'aaron_dumps', displayName: 'Aaron', value: 67, formattedValue: '67 days' },
      { rank: 4, username: 'shelden_s', displayName: 'Shelden', value: 44, formattedValue: '44 days' },
      { rank: 5, username: 'bobby_b', displayName: 'Bobby', value: 1, formattedValue: '1 day' },
    ],
  },
];

// ── Podium Component ────────────────────────────────────────────────────

const PODIUM_MEDAL_COLORS = ['#C0C0C0', Colors.gold, '#CD7F32'] as const;
const PODIUM_MEDAL_ICONS: (keyof typeof Ionicons.glyphMap)[] = ['medal-outline', 'trophy', 'medal-outline'];
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <View style={styles.podiumContainer}>
      {PODIUM_ORDER.map((idx, position) => {
        const entry = top3[idx];
        const isFirst = idx === 0;
        const color = PODIUM_MEDAL_COLORS[idx];
        const icon = PODIUM_MEDAL_ICONS[idx];
        return (
          <FadeInView key={entry.username} delay={position * 150} slideDistance={16}>
            <View style={[styles.podiumSlot, isFirst && styles.podiumSlotFirst]}>
              <Ionicons name={icon} size={isFirst ? 32 : 24} color={color} />
              <View style={[styles.podiumAvatar, { borderColor: color }]}>
                <Text style={[styles.podiumInitial, { color }]}>
                  {entry.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst]} numberOfLines={1}>
                {entry.displayName}
              </Text>
              <Text style={[styles.podiumValue, { color }]}>{entry.formattedValue}</Text>
              <View style={[styles.podiumBar, { height: isFirst ? 80 : idx === 1 ? 56 : 40, backgroundColor: color + '22', borderColor: color + '44' }]} />
              <Text style={[styles.podiumRank, { color }]}>#{entry.rank}</Text>
            </View>
          </FadeInView>
        );
      })}
    </View>
  );
}

// ── Category Card Component ─────────────────────────────────────────────

function CategoryCard({ category, index }: { category: LeaderboardCategory; index: number }) {
  return (
    <FadeInView delay={400 + index * 120} slideDistance={16}>
      <GlassCard style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Ionicons name={category.icon} size={18} color={Colors.gold} />
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>
        <View style={styles.categoryDivider} />
        {category.entries.map((entry) => (
          <View key={entry.username} style={styles.entryRow}>
            <Text style={[styles.entryRank, entry.rank === 1 && styles.entryRankGold]}>
              #{entry.rank}
            </Text>
            <View style={styles.entryAvatarSmall}>
              <Text style={styles.entryInitial}>
                {entry.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.entryName} numberOfLines={1}>{entry.displayName}</Text>
            <Text style={[styles.entryValue, entry.rank === 1 && styles.entryValueGold]}>
              {entry.formattedValue}
            </Text>
          </View>
        ))}
      </GlassCard>
    </FadeInView>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────

export default function HallOfStenchScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<LeaderboardCategory[]>([]);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (MOCK_ENABLED) {
      setCategories(MOCK_HALL_DATA);
    } else {
      // TODO: Fetch from Supabase
      setCategories([]);
    }
  }, []);

  // Use the Dump Score category for the podium (most prestigious)
  const podiumCategory = categories.find((c) => c.key === 'dump_score');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <FadeInView delay={0} slideDistance={12}>
          <View style={styles.titleRow}>
            <Ionicons name="trophy" size={28} color={Colors.gold} />
            <Text style={styles.title}>HALL OF STENCH</Text>
          </View>
        </FadeInView>
        <FadeInView delay={100} slideDistance={8}>
          <Text style={styles.subtitle}>All-Time Global Records</Text>
        </FadeInView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative crown divider */}
        <FadeInView delay={150}>
          <View style={styles.crownDivider}>
            <View style={styles.dividerLine} />
            <Ionicons name="diamond" size={14} color={Colors.goldDim} />
            <View style={styles.dividerLine} />
          </View>
        </FadeInView>

        {/* Podium — top 3 by Dump Score */}
        {podiumCategory && (
          <View style={styles.podiumSection}>
            <Text style={styles.podiumLabel}>TOP DUMP SCORES</Text>
            <Podium entries={podiumCategory.entries} />
          </View>
        )}

        {/* Decorative separator */}
        <FadeInView delay={350}>
          <View style={styles.crownDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ALL-TIME RECORDS</Text>
            <View style={styles.dividerLine} />
          </View>
        </FadeInView>

        {/* Category Cards */}
        {categories.map((category, i) => (
          <CategoryCard key={category.key} category={category} index={i} />
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: Fonts.displayFamily,
    fontSize: 32,
    letterSpacing: 2,
    color: Colors.gold,
  },
  subtitle: {
    ...Type.caption,
    color: Colors.text3,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // ── Crown Divider ──
  crownDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.goldDim,
  },
  dividerText: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.text3,
  },

  // ── Podium ──
  podiumSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumLabel: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.text3,
    marginBottom: 16,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  podiumSlot: {
    alignItems: 'center',
    width: 90,
    gap: 6,
  },
  podiumSlotFirst: {
    marginBottom: 12,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: Colors.glass2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumInitial: {
    fontFamily: Fonts.displayFamily,
    fontSize: 20,
  },
  podiumName: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 12,
    color: Colors.text2,
    textAlign: 'center',
  },
  podiumNameFirst: {
    color: Colors.gold,
    fontSize: 14,
  },
  podiumValue: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 14,
  },
  podiumBar: {
    width: '100%',
    borderRadius: 6,
    borderWidth: 1,
  },
  podiumRank: {
    fontFamily: Fonts.monoFamily,
    fontSize: 11,
    marginTop: -2,
  },

  // ── Category Cards ──
  categoryCard: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  categoryTitle: {
    fontFamily: Fonts.displaySemiBoldFamily,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: 0.5,
  },
  categoryDivider: {
    height: 1,
    backgroundColor: Colors.glassBorder,
    marginHorizontal: 16,
    marginBottom: 6,
  },

  // ── Entry Rows ──
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  entryRank: {
    fontFamily: Fonts.monoFamily,
    fontSize: 13,
    color: Colors.text3,
    width: 28,
  },
  entryRankGold: {
    color: Colors.gold,
  },
  entryAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.glass2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInitial: {
    fontFamily: Fonts.displayFamily,
    fontSize: 13,
    color: Colors.text2,
  },
  entryName: {
    flex: 1,
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 14,
    color: Colors.text1,
  },
  entryValue: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 13,
    color: Colors.text2,
  },
  entryValueGold: {
    color: Colors.goldBright,
  },
  bottomPad: {
    height: 100,
  },
});
