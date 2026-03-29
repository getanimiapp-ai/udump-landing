import { supabase } from '@/lib/supabase';
import { MOCK_ENABLED, MOCK_ACHIEVEMENTS } from '../../lib/mock-data';
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
import { GlassCard } from '../../components/ui/GlassCard';
import { ACHIEVEMENTS, AchievementTier } from '../../constants/achievements';
import { Colors, TIER_COLORS } from '../../constants/colors';
import { Type } from '../../constants/typography';

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          {unlockedKeys.size} / {ACHIEVEMENTS.length} unlocked
        </Text>
      </View>

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
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredAchievements.map((achievement) => {
          const isUnlocked = unlockedKeys.has(achievement.key);
          const unlockDate = getUnlockDate(achievement.key);
          const tierColors = TIER_COLORS[achievement.tier];
          const isSecret = achievement.secret && !isUnlocked;

          return (
            <GlassCard
              key={achievement.key}
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
