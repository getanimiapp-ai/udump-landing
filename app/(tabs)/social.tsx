import { supabase } from '@/lib/supabase';
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
import { Type } from '../../constants/typography';
import { formatDistanceToNow } from 'date-fns';

type FeedItemType = 'session' | 'record' | 'throne_claimed' | 'overstay';

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
  minutes?: number;
}

type FilterType = 'all' | 'records' | 'thrones' | 'alerts';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'records', label: 'Records' },
  { key: 'thrones', label: 'Thrones' },
  { key: 'alerts', label: 'Alerts' },
];

function FeedItemCard({ item }: { item: FeedEntry }) {
  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (item.type === 'overstay') {
    return (
      <GlassCard style={styles.alertCard}>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>🚨</Text>
            <Text style={styles.alertText}>
              {item.displayName} has been on the toilet for {item.minutes} minutes
            </Text>
          </View>
          <Badge label="WELFARE CHECK RECOMMENDED" color="red" />
          <View style={styles.replyChips}>
            {["You okay?", "Need help?", "👑"].map((reply) => (
              <TouchableOpacity key={reply} style={styles.replyChip}>
                <Text style={styles.replyChipText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      style={[
        styles.feedCard,
        item.type === 'record' && styles.feedCardRecord,
        item.type === 'throne_claimed' && styles.feedCardThrone,
      ]}
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
          <Text style={styles.throneText}>👑 Now King of {item.throneName}</Text>
        )}
      </View>
    </GlassCard>
  );
}

export default function SocialScreen() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    const friendIds = (friendships ?? []).map((f) => f.friend_id);
    if (friendIds.length === 0) {
      setFeed([]);
      return;
    }

    // Get recent sessions from friends
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

    const entries: FeedEntry[] = sessions.map((s): FeedEntry => {
      const prof = s.profiles as { username: string; display_name: string | null; avatar_url: string | null };
      const throne = s.thrones as { name: string } | null;

      let type: FeedItemType = 'session';
      if (s.is_personal_record) type = 'record';
      else if (s.throne_claimed) type = 'throne_claimed';

      return {
        id: s.id,
        type,
        userId: s.user_id,
        username: prof.username,
        displayName: prof.display_name ?? prof.username,
        avatarUrl: prof.avatar_url,
        durationSeconds: s.duration_seconds,
        weightDelta: s.weight_delta_lbs,
        throneName: throne?.name ?? null,
        createdAt: s.ended_at!,
      };
    });

    setFeed(entries);
  }, []);

  useEffect(() => {
    fetchFeed();

    // Realtime subscription
    const channel = supabase
      .channel('friend-sessions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dump_sessions' }, () => {
        fetchFeed();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, [fetchFeed]);

  const filteredFeed = feed.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'records') return item.type === 'record';
    if (filter === 'thrones') return item.type === 'throne_claimed';
    if (filter === 'alerts') return item.type === 'overstay';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => (
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

      <ScrollView
        contentContainerStyle={styles.feedList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredFeed.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👑</Text>
            <Text style={styles.emptyTitle}>No activity yet.</Text>
            <Text style={styles.emptyBody}>Add friends to see their sessions here.</Text>
          </View>
        ) : (
          filteredFeed.map((item) => <FeedItemCard key={item.id} item={item} />)
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    ...Type.display,
    fontSize: 28,
    color: Colors.text1,
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
  feedList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  feedCard: {},
  feedCardRecord: {
    borderColor: 'rgba(212,175,55,0.3)',
  },
  feedCardThrone: {
    borderColor: 'rgba(212,175,55,0.2)',
  },
  feedContent: {
    padding: 16,
    gap: 10,
  },
  feedHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  feedHeaderText: {
    flex: 1,
    gap: 4,
  },
  feedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedName: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '600',
  },
  feedTime: {
    ...Type.caption,
    color: Colors.text3,
  },
  feedStats: {
    flexDirection: 'row',
    gap: 16,
  },
  feedStatValue: {
    ...Type.mono,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text1,
  },
  feedStatGold: {
    color: Colors.gold,
  },
  throneText: {
    ...Type.body,
    color: Colors.gold,
    fontSize: 13,
  },
  alertCard: {
    borderColor: 'rgba(255,59,48,0.3)',
  },
  alertContent: {
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(255,59,48,0.04)',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    ...Type.body,
    color: Colors.red,
    fontWeight: '600',
    flex: 1,
  },
  replyChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  replyChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass2,
  },
  replyChipText: {
    ...Type.caption,
    color: Colors.text2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    ...Type.display,
    fontSize: 20,
    color: Colors.text2,
  },
  emptyBody: {
    ...Type.body,
    color: Colors.text3,
    textAlign: 'center',
  },
  bottomPad: {
    height: 100,
  },
});
