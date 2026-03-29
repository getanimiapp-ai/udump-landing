import { supabase } from '@/lib/supabase';
import { MOCK_ENABLED, MOCK_ACHIEVEMENTS } from '../../lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { ACHIEVEMENTS, AchievementTier } from '../../constants/achievements';
import { Colors, TIER_COLORS } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

type TierFilter = 'all' | AchievementTier;

interface UnlockedAchievement {
  achievement_key: string;
  unlocked_at: string;
}

const TIER_FILTERS: { key: TierFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'bronze', label: 'Bronze' },
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
  { key: 'platinum', label: 'Platinum' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);
  const [filter, setFilter] = useState<TierFilter>('all');

  useEffect(() => {
    if (MOCK_ENABLED) {
      setUnlocked(MOCK_ACHIEVEMENTS);
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    if (MOCK_ENABLED) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_achievements')
      .select('achievement_key, unlocked_at')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    if (data) setUnlocked(data);
  }, []);

  useEffect(() => { fetchAchievements(); }, [fetchAchievements]);

  const unlockedKeys = new Set(unlocked.map((u) => u.achievement_key));

  const filteredAchievements = ACHIEVEMENTS.filter((a) => {
    if (filter !== 'all' && a.tier !== filter) return false;
    return true;
  });

  const getUnlockDate = (key: string) => {
    const u = unlocked.find((u) => u.achievement_key === key);
    return u?.unlocked_at;
  };

  const totalXP = unlocked.length * 50; // 50 XP per achievement
  const bronzeCount = ACHIEVEMENTS.filter((a) => a.tier === 'bronze' && unlockedKeys.has(a.key)).length;
  const silverCount = ACHIEVEMENTS.filter((a) => a.tier === 'silver' && unlockedKeys.has(a.key)).length;
  const goldCount = ACHIEVEMENTS.filter((a) => a.tier === 'gold' && unlockedKeys.has(a.key)).length;
  const platCount = ACHIEVEMENTS.filter((a) => a.tier === 'platinum' && unlockedKeys.has(a.key)).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStatBadge}>
            <Ionicons name="flash" size={12} color={Colors.gold} />
            <AnimatedNumber value={totalXP} style={styles.headerStatValue} suffix=" XP" />
          </View>
          <Text style={styles.subtitle}>
            {unlockedKeys.size} / {ACHIEVEMENTS.length} unlocked
          </Text>
        </View>
      </View>

      {/* Tier Progress */}
      <FadeInView delay={0}>
        <View style={styles.tierProgress}>
          {[
            { label: 'BRONZE', count: bronzeCount, total: ACHIEVEMENTS.filter((a) => a.tier === 'bronze').length, color: '#CD7F32' },
            { label: 'SILVER', count: silverCount, total: ACHIEVEMENTS.filter((a) => a.tier === 'silver').length, color: '#C0C0C0' },
            { label: 'GOLD', count: goldCount, total: ACHIEVEMENTS.filter((a) => a.tier === 'gold').length, color: Colors.gold },
            { label: 'PLAT', count: platCount, total: ACHIEVEMENTS.filter((a) => a.tier === 'platinum').length, color: '#64B4FF' },
          ].map((tier) => (
            <View key={tier.label} style={styles.tierItem}>
              <Text style={[styles.tierCount, { color: tier.color }]}>{tier.count}/{tier.total}</Text>
              <View style={styles.tierTrack}>
                <View style={[styles.tierFill, { width: `${tier.total > 0 ? (tier.count / tier.total) * 100 : 0}%`, backgroundColor: tier.color }]} />
              </View>
              <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* Recently Unlocked */}
      {unlocked.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentLabel}>RECENTLY UNLOCKED</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          >
            {unlocked.slice(0, 8).map((u) => {
              const a = ACHIEVEMENTS.find((x) => x.key === u.achievement_key);
              if (!a) return null;
              const tc = TIER_COLORS[a.tier];
              return (
                <View
                  key={u.achievement_key}
                  style={[styles.recentCard, { borderColor: tc.border, backgroundColor: tc.bg }]}
                >
                  <Text style={styles.recentIcon}>{a.icon}</Text>
                  <Text style={[styles.recentTitle, { color: tc.text }]} numberOfLines={1}>
                    {a.title}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Tier filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {TIER_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredAchievements.map((achievement, i) => {
          const isUnlocked = unlockedKeys.has(achievement.key);
          const unlockDate = getUnlockDate(achievement.key);
          const tierColors = TIER_COLORS[achievement.tier];
          const isSecret = achievement.secret && !isUnlocked;

          return (
            <FadeInView key={achievement.key} delay={i * 50} slideDistance={12}>
            <GlassCard
              style={[
                styles.achievementCard,
                isUnlocked && { borderColor: tierColors.border, backgroundColor: tierColors.bg },
                !isUnlocked && styles.achievementCardLocked,
              ]}
            >
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementIcon, !isUnlocked && styles.iconLocked]}>
                  {isSecret ? '?' : achievement.icon}
                </Text>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, !isUnlocked && styles.textLocked]}>
                    {isSecret ? '???' : achievement.title}
                  </Text>
                  <Text style={[styles.achievementDesc, !isUnlocked && styles.textLocked]}>
                    {isSecret ? 'Secret achievement' : achievement.description}
                  </Text>
                  {isUnlocked && unlockDate && (
                    <Text style={[styles.unlockDate, { color: tierColors.text }]}>
                      Unlocked {formatDistanceToNow(new Date(unlockDate), { addSuffix: true })}
                    </Text>
                  )}
                </View>
                <View style={styles.tierBadge}>
                  <Text style={[styles.tierLabel, { color: tierColors.text }]}>
                    {achievement.tier.toUpperCase()}
                  </Text>
                </View>
              </View>
            </GlassCard>
            </FadeInView>
          );
        })}
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
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  headerStatValue: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 12,
    color: Colors.gold,
  },
  tierProgress: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  tierItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tierCount: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 12,
  },
  tierTrack: {
    height: 4,
    width: '100%',
    backgroundColor: Colors.glass2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tierFill: {
    height: '100%',
    borderRadius: 2,
  },
  tierLabel: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 8,
    letterSpacing: 1,
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
  recentSection: {
    paddingBottom: 16,
  },
  recentLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  recentList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  recentCard: {
    width: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 5,
  },
  recentIcon: {
    fontSize: 28,
  },
  recentTitle: {
    ...Type.caption,
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  filters: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass1,
  },
  filterChipActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
  },
  filterLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
  },
  filterLabelActive: {
    color: Colors.gold,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  achievementCard: {
    overflow: 'hidden',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  achievementIcon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.4,
  },
  achievementInfo: {
    flex: 1,
    gap: 3,
  },
  achievementTitle: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '600',
    fontSize: 15,
  },
  achievementDesc: {
    ...Type.caption,
    color: Colors.text2,
    lineHeight: 18,
  },
  textLocked: {
    color: Colors.text3,
  },
  unlockDate: {
    ...Type.caption,
    fontSize: 11,
    marginTop: 2,
  },
  tierBadge: {
    alignSelf: 'flex-start',
  },
  tierLabel: {
    ...Type.label,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  bottomPad: {
    height: 100,
  },
});
