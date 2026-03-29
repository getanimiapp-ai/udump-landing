import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { Ionicons } from '@expo/vector-icons';
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
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';
import { formatDistanceToNow } from 'date-fns';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type FeedItemType = 'session' | 'record' | 'throne_claimed' | 'overstay';
type MainTab = 'feed' | 'leaderboard';
type LeaderboardTab = 'friends' | 'global';
type FeedFilter = 'all' | 'records' | 'thrones' | 'alerts';

interface FeedEntry {
  id: string;
  type: FeedItemType;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  durationSeconds: number | null;
  weightDelta: number | null;
  throneName: string | null;
  createdAt: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalWeightLbs: number;
  dumpScore: number;
  isSelf: boolean;
}

// ─────────────────────────────────────────────
// Feed Item Component
// ─────────────────────────────────────────────

function FeedItemCard({ item }: { item: FeedEntry }) {
  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (item.type === 'overstay') {
    return (
      <GlassCard style={styles.alertCard}>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning-outline" size={16} color={Colors.red} />
            <Text style={styles.alertText}>
              {item.displayName} has been on the toilet for an extended period
            </Text>
          </View>
          <Badge label="WELFARE CHECK RECOMMENDED" color="red" />
          <View style={styles.replyChips}>
            {['You okay?', 'Need help?', 'Crown'].map((reply) => (
              <TouchableOpacity key={reply} style={styles.replyChip}>
                <Text style={styles.replyChipText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </GlassCard>
    );
  }

  const isHighlight = item.type === 'record' || item.type === 'throne_claimed';

  return (
    <GlassCard
      style={styles.feedCard}
      gold={isHighlight}
    >
      <View style={styles.feedContent}>
        <View style={styles.feedHeader}>
          <Avatar uri={item.avatarUrl} username={item.displayName} size={36} />
          <View style={styles.feedHeaderText}>
            <View style={styles.feedTitleRow}>
              <Text style={styles.feedName}>{item.displayName}</Text>
              {item.type === 'record' && <Badge label="RECORD" color="gold" />}
              {item.type === 'throne_claimed' && <Badge label="THRONE CLAIMED" color="gold" />}
            </View>
            <Text style={styles.feedTime}>
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>
        {(item.durationSeconds != null || item.weightDelta != null) && (
          <View style={styles.feedStats}>
            {item.durationSeconds != null && (
              <Text style={styles.feedStatValue}>{formatDuration(item.durationSeconds)}</Text>
            )}
            {item.weightDelta != null && item.weightDelta > 0 && (
              <Text style={[styles.feedStatValue, styles.feedStatGold]}>
                {item.weightDelta.toFixed(2)} lbs
              </Text>
            )}
          </View>
        )}
        {item.throneName && item.type === 'throne_claimed' && (
          <Text style={styles.throneText}>Now King of {item.throneName}</Text>
        )}
      </View>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────
// Leaderboard Row Component
// ─────────────────────────────────────────────

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;
  const isLastPlace = entry.rank > 5 && entry.username === 'bobby';

  return (
    <GlassCard
      style={[
        styles.leaderboardCard,
        entry.isSelf && styles.leaderboardCardSelf,
      ]}
      gold={isTop3}
    >
      <View style={[styles.leaderboardContent, isLastPlace && styles.leaderboardContentBobby]}>
        <View style={styles.rankSection}>
          {isTop3 ? (
            <Ionicons
              name="crown"
              size={20}
              color={entry.rank === 1 ? Colors.gold : Colors.text3}
            />
          ) : (
            <Text style={[styles.rankNumber, isLastPlace && styles.rankNumberBobby]}>
              #{entry.rank}
            </Text>
          )}
        </View>
        <Avatar uri={entry.avatarUrl} username={entry.displayName} size={36} />
        <View style={styles.leaderboardInfo}>
          <Text style={[styles.leaderboardName, entry.isSelf && styles.leaderboardNameSelf]}>
            {entry.displayName}
          </Text>
          <Text style={styles.leaderboardUsername}>@{entry.username}</Text>
        </View>
        <View style={styles.leaderboardStats}>
          <Text style={[styles.leaderboardWeight, isLastPlace && styles.leaderboardWeightBobby]}>
            {entry.totalWeightLbs.toFixed(1)}
          </Text>
          <Text style={styles.leaderboardWeightLabel}>lbs</Text>
        </View>
      </View>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

const FEED_FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'records', label: 'Records' },
  { key: 'thrones', label: 'Thrones' },
  { key: 'alerts', label: 'Alerts' },
];

export default function SocialScreen() {
  const { profile: _profile } = useUserStore();
  const [mainTab, setMainTab] = useState<MainTab>('feed');
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>('friends');
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    const friendIds = (friendships ?? []).map((f) => f.friend_id);
    if (friendIds.length === 0) { setFeed([]); return; }

    const { data: sessions } = await supabase
      .from('dump_sessions')
      .select(`
        id, user_id, started_at, ended_at, duration_seconds,
        weight_delta_lbs, is_personal_record, throne_claimed, throne_id,
        profiles!inner(username, display_name, avatar_url),
        thrones(name)
      `)
      .in('user_id', friendIds)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(30);

    if (!sessions) return;

    setFeed(sessions.map((s): FeedEntry => {
      const prof = s.profiles as { username: string; display_name: string | null; avatar_url: string | null };
      const throne = s.thrones as { name: string } | null;
      let type: FeedItemType = 'session';
      if (s.is_personal_record) type = 'record';
      else if (s.throne_claimed) type = 'throne_claimed';
      return {
        id: s.id, type,
        userId: s.user_id,
        username: prof.username,
        displayName: prof.display_name ?? prof.username,
        avatarUrl: prof.avatar_url,
        durationSeconds: s.duration_seconds,
        weightDelta: s.weight_delta_lbs,
        throneName: throne?.name ?? null,
        createdAt: s.ended_at!,
      };
    }));
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (leaderboardTab === 'friends') {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const friendIds = [(friendships ?? []).map((f) => f.friend_id), user.id].flat();

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, total_weight_lbs, dump_score')
        .in('id', friendIds)
        .order('total_weight_lbs', { ascending: false });

      if (!profiles) return;

      const entries: LeaderboardEntry[] = profiles.map((p, i) => ({
        rank: i + 1,
        userId: p.id,
        username: p.username,
        displayName: p.display_name ?? p.username,
        avatarUrl: p.avatar_url,
        totalWeightLbs: p.total_weight_lbs,
        dumpScore: p.dump_score,
        isSelf: p.id === user.id,
      }));

      // Bobby always last
      const bobbyIdx = entries.findIndex((e) => e.username === 'bobby');
      if (bobbyIdx >= 0 && bobbyIdx !== entries.length - 1) {
        const bobby = entries.splice(bobbyIdx, 1)[0];
        entries.push({ ...bobby, rank: entries.length + 1 });
        entries.forEach((e, i) => { if (e.username !== 'bobby') e.rank = i + 1; });
      }

      setLeaderboard(entries);
    } else {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, total_weight_lbs, dump_score')
        .order('total_weight_lbs', { ascending: false })
        .limit(100);

      if (!profiles) return;

      const entries: LeaderboardEntry[] = profiles.map((p, i) => ({
        rank: i + 1,
        userId: p.id,
        username: p.username,
        displayName: p.display_name ?? p.username,
        avatarUrl: p.avatar_url,
        totalWeightLbs: p.total_weight_lbs,
        dumpScore: p.dump_score,
        isSelf: p.id === user.id,
      }));

      // Bobby always last
      const bobbyIdx = entries.findIndex((e) => e.username === 'bobby');
      if (bobbyIdx >= 0 && bobbyIdx !== entries.length - 1) {
        const bobby = entries.splice(bobbyIdx, 1)[0];
        entries.push({ ...bobby, rank: entries.length + 1 });
      }

      setLeaderboard(entries);
    }
  }, [leaderboardTab]);

  useEffect(() => {
    fetchFeed();
    const channel = supabase
      .channel('friend-sessions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dump_sessions' }, () => {
        fetchFeed();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchFeed]);

  useEffect(() => {
    if (mainTab === 'leaderboard') fetchLeaderboard();
  }, [mainTab, leaderboardTab, fetchLeaderboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mainTab === 'feed') await fetchFeed();
    else await fetchLeaderboard();
    setRefreshing(false);
  }, [mainTab, fetchFeed, fetchLeaderboard]);

  const filteredFeed = feed.filter((item) => {
    if (feedFilter === 'all') return true;
    if (feedFilter === 'records') return item.type === 'record';
    if (feedFilter === 'thrones') return item.type === 'throne_claimed';
    if (feedFilter === 'alerts') return item.type === 'overstay';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Tab Switcher */}
      <View style={styles.mainTabRow}>
        <TouchableOpacity
          onPress={() => setMainTab('feed')}
          style={[styles.mainTab, mainTab === 'feed' && styles.mainTabActive]}
        >
          <Text style={[styles.mainTabLabel, mainTab === 'feed' && styles.mainTabLabelActive]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMainTab('leaderboard')}
          style={[styles.mainTab, mainTab === 'leaderboard' && styles.mainTabActive]}
        >
          <Text style={[styles.mainTabLabel, mainTab === 'leaderboard' && styles.mainTabLabelActive]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {mainTab === 'feed' ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            style={styles.filtersScroll}
          >
            {FEED_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFeedFilter(f.key)}
                style={[styles.filterChip, feedFilter === f.key && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, feedFilter === f.key && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            contentContainerStyle={styles.feedList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredFeed.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No friends yet.</Text>
                <Text style={styles.emptyBody}>Add friends to see who reigns supreme. Bobby will be last.</Text>
              </View>
            ) : (
              filteredFeed.map((item) => <FeedItemCard key={item.id} item={item} />)
            )}
            <View style={styles.bottomPad} />
          </ScrollView>
        </>
      ) : (
        <>
          {/* Leaderboard Sub-tabs */}
          <View style={styles.subTabRow}>
            <TouchableOpacity
              onPress={() => setLeaderboardTab('friends')}
              style={[styles.subTab, leaderboardTab === 'friends' && styles.subTabActive]}
            >
              <Text style={[styles.subTabLabel, leaderboardTab === 'friends' && styles.subTabLabelActive]}>
                Friends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLeaderboardTab('global')}
              style={[styles.subTab, leaderboardTab === 'global' && styles.subTabActive]}
            >
              <Text style={[styles.subTabLabel, leaderboardTab === 'global' && styles.subTabLabelActive]}>
                Global Top 100
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.leaderboardList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardHeaderText}>
                {leaderboardTab === 'friends' ? 'All-time by total weight' : 'Global all-time rankings'}
              </Text>
            </View>
            {leaderboard.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="crown-outline" size={48} color={Colors.goldDim} />
                <Text style={styles.emptyTitle}>No data yet.</Text>
                <Text style={styles.emptyBody}>Log sessions to appear on the leaderboard.</Text>
              </View>
            ) : (
              leaderboard.map((entry) => <LeaderboardRow key={entry.userId} entry={entry} />)
            )}
            <View style={styles.bottomPad} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  mainTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.glass1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  mainTabActive: {
    backgroundColor: Colors.goldDim,
    borderColor: Colors.gold,
  },
  mainTabLabel: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.text3,
  },
  mainTabLabelActive: {
    color: Colors.gold,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass1,
    alignItems: 'center',
    justifyContent: 'center',
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
  feedList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  feedCard: {},
  feedContent: { padding: 16, gap: 10 },
  feedHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  feedHeaderText: { flex: 1, gap: 4 },
  feedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedName: { fontFamily: Fonts.displayFamily, fontSize: 16, letterSpacing: -0.3, color: Colors.text1 },
  feedTime: { fontFamily: Fonts.monoFamily, fontSize: 11, color: Colors.text3 },
  feedStats: { flexDirection: 'row', gap: 16 },
  feedStatValue: { fontFamily: Fonts.monoMediumFamily, fontSize: 20, color: Colors.text1 },
  feedStatGold: { color: Colors.gold },
  throneText: { fontFamily: Fonts.bodySemiBoldFamily, color: Colors.gold, fontSize: 13, letterSpacing: 0.3 },
  alertCard: { borderColor: 'rgba(255,59,48,0.3)' },
  alertContent: { padding: 16, gap: 10, backgroundColor: 'rgba(255,59,48,0.04)' },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  alertText: { fontFamily: Fonts.bodySemiBoldFamily, color: Colors.red, flex: 1, fontSize: 14, lineHeight: 20 },
  replyChips: { flexDirection: 'row', gap: 8, marginTop: 4 },
  replyChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.glassBorder, backgroundColor: Colors.glass2,
  },
  replyChipText: { ...Type.caption, color: Colors.text2 },
  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: Colors.gold,
  },
  subTabLabel: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 11,
    letterSpacing: 0.3,
    color: Colors.text3,
  },
  subTabLabelActive: {
    color: Colors.gold,
  },
  leaderboardList: {
    paddingHorizontal: 20,
    gap: 8,
    paddingTop: 8,
  },
  leaderboardHeader: {
    paddingBottom: 8,
  },
  leaderboardHeaderText: {
    ...Type.caption,
    color: Colors.text3,
  },
  leaderboardCard: {},
  leaderboardCardSelf: {
    borderColor: Colors.gold,
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  leaderboardContentBobby: {
    opacity: 0.7,
  },
  rankSection: {
    width: 36,
    alignItems: 'center',
  },
  rankNumber: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 16,
    color: Colors.text3,
  },
  rankNumberBobby: {
    color: Colors.red,
  },
  leaderboardInfo: {
    flex: 1,
    gap: 2,
  },
  leaderboardName: {
    fontFamily: Fonts.displayFamily,
    fontSize: 16,
    letterSpacing: -0.3,
    color: Colors.text1,
  },
  leaderboardNameSelf: {
    color: Colors.gold,
  },
  leaderboardUsername: {
    fontFamily: Fonts.monoFamily,
    fontSize: 11,
    color: Colors.text3,
  },
  leaderboardStats: {
    alignItems: 'flex-end',
    gap: 1,
  },
  leaderboardWeight: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 16,
    color: Colors.gold,
  },
  leaderboardWeightBobby: {
    color: Colors.red,
  },
  leaderboardWeightLabel: {
    ...Type.caption,
    color: Colors.text3,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontFamily: Fonts.displayFamily, fontSize: 20, letterSpacing: -0.3, color: Colors.text2 },
  emptyBody: { ...Type.body, color: Colors.text3, textAlign: 'center' },
  bottomPad: { height: 100 },
});
