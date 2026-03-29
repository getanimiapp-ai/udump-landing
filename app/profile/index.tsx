import { useUserStore } from '@/lib/store/user.store';
import { MOCK_ENABLED, MOCK_PROFILE, MOCK_ACHIEVEMENTS, MOCK_FRIENDS } from '../../lib/mock-data';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { GlassCard } from '../../components/ui/GlassCard';
import { ACHIEVEMENTS } from '../../constants/achievements';
import { Colors, TIER_COLORS } from '../../constants/colors';
import { Type } from '../../constants/typography';
import { supabase } from '../../lib/supabase';

interface UnlockedAchievement {
  achievement_key: string;
  unlocked_at: string;
}

interface Friend {
  friend_id: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    dump_score: number;
    total_sessions: number;
  };
}

interface PendingRequest {
  id: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface NotificationPrefs {
  record_broken: boolean;
  throne_claimed: boolean;
  throne_lost: boolean;
  overstay_60: boolean;
  friend_active: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  record_broken: true,
  throne_claimed: true,
  throne_lost: true,
  overstay_60: true,
  friend_active: false,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, fetchProfile } = useUserStore();

  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [throneCount, setThroneCount] = useState(0);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResult, setSearchResult] = useState<{
    id: string;
    username: string;
    display_name: string | null;
  } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const displayProfile = MOCK_ENABLED ? MOCK_PROFILE : profile;

  useEffect(() => {
    if (MOCK_ENABLED) {
      setUnlocked(MOCK_ACHIEVEMENTS);
      setFriends(MOCK_FRIENDS as unknown as Friend[]);
      setGlobalRank(2);
      setThroneCount(2);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (MOCK_ENABLED) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !profile) return;

    const [
      { data: achievementData },
      { data: friendData },
      { data: pendingData },
      { count: higherCount },
      { count: throneHeld },
      { data: profileData },
    ] = await Promise.all([
      supabase
        .from('user_achievements')
        .select('achievement_key, unlocked_at')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false }),
      supabase
        .from('friendships')
        .select(
          'friend_id, profiles:profiles!friendships_friend_id_fkey(id, username, display_name, avatar_url, dump_score, total_sessions)',
        )
        .eq('user_id', user.id)
        .eq('status', 'accepted'),
      supabase
        .from('friendships')
        .select(
          'id, user_id, profiles:profiles!friendships_user_id_fkey(username, display_name, avatar_url)',
        )
        .eq('friend_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('dump_score', profile.dump_score),
      supabase
        .from('thrones')
        .select('id', { count: 'exact', head: true })
        .eq('current_king_id', user.id),
      supabase.from('profiles').select('notification_prefs').eq('id', user.id).single(),
    ]);

    if (achievementData) setUnlocked(achievementData);
    if (friendData) setFriends(friendData as unknown as Friend[]);
    if (pendingData) setPendingRequests(pendingData as unknown as PendingRequest[]);
    if (higherCount != null) setGlobalRank(higherCount + 1);
    if (throneHeld != null) setThroneCount(throneHeld);
    if (profileData?.notification_prefs) {
      setNotifPrefs({
        ...DEFAULT_PREFS,
        ...(profileData.notification_prefs as Partial<NotificationPrefs>),
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAvatarPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      await fetchProfile(user.id);
    } catch {
      Alert.alert('Upload failed', 'Could not upload avatar. Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleNotifToggle = async (key: keyof NotificationPrefs) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await supabase.from('profiles').update({ notification_prefs: updated }).eq('id', user.id);
  };

  const handleFriendSearch = async () => {
    if (!friendSearch.trim()) return;
    setSearchResult(null);

    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', friendSearch.trim().toLowerCase())
      .single();

    if (data) {
      setSearchResult(data);
    } else {
      Alert.alert('Not found', `No user with username "${friendSearch}".`);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({ user_id: user.id, friend_id: searchResult.id, status: 'pending' });

    if (error) {
      Alert.alert('Already sent', 'Friend request already sent or you are already friends.');
    } else {
      Alert.alert('Request sent', `Friend request sent to @${searchResult.username}.`);
      setSearchResult(null);
      setFriendSearch('');
    }
  };

  const handleAcceptRequest = async (requestId: string, requestUserId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    await supabase
      .from('friendships')
      .upsert({ user_id: user.id, friend_id: requestUserId, status: 'accepted' });

    fetchData();
  };

  const handleDeclineRequest = async (requestId: string) => {
    await supabase.from('friendships').delete().eq('id', requestId);
    fetchData();
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const recentUnlocked = unlocked.slice(0, 8);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAvatarPress} disabled={uploadingAvatar}>
            <Avatar
              uri={displayProfile?.avatar_url}
              username={displayProfile?.display_name ?? displayProfile?.username}
              size={80}
            />
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>{uploadingAvatar ? '…' : '✎'}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.displayName}>{displayProfile?.display_name ?? displayProfile?.username}</Text>
            <Text style={styles.username}>@{displayProfile?.username}</Text>
            <Text style={styles.dumpScore}>
              Dump Score™ {displayProfile?.dump_score?.toFixed(1) ?? '—'}
            </Text>
            {globalRank != null && (
              <Text style={styles.globalRank}>#{globalRank} globally</Text>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <GlassCard>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayProfile?.total_sessions ?? 0}</Text>
              <Text style={styles.statLabel}>SESSIONS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.goldText]}>
                {(displayProfile?.total_weight_lbs ?? 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>TOTAL LBS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{throneCount}</Text>
              <Text style={styles.statLabel}>THRONES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{friends.length}</Text>
              <Text style={styles.statLabel}>FRIENDS</Text>
            </View>
          </View>
        </GlassCard>

        {/* Achievements Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity onPress={() => router.push('/profile/achievements')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSub}>
            {unlocked.length} / {ACHIEVEMENTS.length} unlocked
          </Text>
          {recentUnlocked.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementScroll}
            >
              {recentUnlocked.map((u) => {
                const a = ACHIEVEMENTS.find((x) => x.key === u.achievement_key);
                if (!a) return null;
                const tc = TIER_COLORS[a.tier];
                return (
                  <View
                    key={u.achievement_key}
                    style={[
                      styles.achievementBadge,
                      { borderColor: tc.border, backgroundColor: tc.bg },
                    ]}
                  >
                    <Text style={styles.achievementIcon}>{a.icon}</Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>
              Complete your first session to earn achievements.
            </Text>
          )}
        </View>

        {/* Analytics Nav */}
        <TouchableOpacity onPress={() => router.push('/profile/analytics')}>
          <GlassCard style={styles.navCard}>
            <View style={styles.navContent}>
              <Text style={styles.navIcon}>📊</Text>
              <Text style={styles.navLabel}>Analytics</Text>
              <Text style={styles.navArrow}>›</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Friends Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>

          <GlassCard style={styles.searchCard}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                placeholderTextColor={Colors.text3}
                value={friendSearch}
                onChangeText={setFriendSearch}
                onSubmitEditing={handleFriendSearch}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={handleFriendSearch} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
            {searchResult && (
              <View style={styles.searchResult}>
                <Text style={styles.searchResultName}>
                  {searchResult.display_name ?? searchResult.username}
                </Text>
                <Text style={styles.searchResultUser}>@{searchResult.username}</Text>
                <TouchableOpacity onPress={handleAddFriend} style={styles.addFriendBtn}>
                  <Text style={styles.addFriendBtnText}>Add Friend</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          {pendingRequests.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingLabel}>PENDING REQUESTS</Text>
              {pendingRequests.map((req) => (
                <GlassCard key={req.id} style={styles.pendingCard}>
                  <View style={styles.pendingContent}>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName}>
                        {req.profiles.display_name ?? req.profiles.username}
                      </Text>
                      <Text style={styles.pendingUser}>@{req.profiles.username}</Text>
                    </View>
                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        onPress={() => handleAcceptRequest(req.id, req.user_id)}
                        style={styles.acceptBtn}
                      >
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeclineRequest(req.id)}
                        style={styles.declineBtn}
                      >
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}

          {friends.length > 0 ? (
            <View style={styles.friendsList}>
              {friends.map((f) => (
                <GlassCard key={f.friend_id} style={styles.friendCard}>
                  <View style={styles.friendContent}>
                    <Avatar
                      uri={f.profiles.avatar_url}
                      username={f.profiles.display_name ?? f.profiles.username}
                      size={36}
                    />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {f.profiles.display_name ?? f.profiles.username}
                      </Text>
                      <Text style={styles.friendSessions}>
                        {f.profiles.total_sessions} sessions
                      </Text>
                    </View>
                    <Text style={styles.friendScore}>
                      {f.profiles.dump_score?.toFixed(1) ?? '—'}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          ) : (
            pendingRequests.length === 0 && (
              <Text style={styles.emptyText}>
                No friends yet. Search by username to connect.
              </Text>
            )
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <GlassCard>
            {(
              [
                { key: 'record_broken', label: 'Personal Records' },
                { key: 'throne_claimed', label: 'Throne Claims' },
                { key: 'throne_lost', label: 'Throne Lost' },
                { key: 'overstay_60', label: 'Overstay Alerts' },
                { key: 'friend_active', label: 'Friend Active' },
              ] as { key: keyof NotificationPrefs; label: string }[]
            ).map((item, idx, arr) => (
              <View
                key={item.key}
                style={[styles.notifRow, idx < arr.length - 1 && styles.notifRowBorder]}
              >
                <Text style={styles.notifLabel}>{item.label}</Text>
                <Switch
                  value={notifPrefs[item.key]}
                  onValueChange={() => handleNotifToggle(item.key)}
                  trackColor={{ false: Colors.glass3, true: Colors.goldDim }}
                  thumbColor={notifPrefs[item.key] ? Colors.gold : Colors.text3}
                />
              </View>
            ))}
          </GlassCard>
        </View>

        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    paddingVertical: 8,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    fontSize: 12,
    color: Colors.void,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  displayName: {
    ...Type.display,
    fontSize: 26,
    color: Colors.text1,
  },
  username: {
    ...Type.body,
    color: Colors.text3,
    fontSize: 14,
  },
  dumpScore: {
    ...Type.mono,
    fontSize: 12,
    color: Colors.gold,
  },
  globalRank: {
    ...Type.caption,
    color: Colors.text3,
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.glassBorder,
  },
  statValue: {
    ...Type.mono,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text1,
  },
  goldText: {
    color: Colors.gold,
  },
  statLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 8,
    letterSpacing: 1,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '600',
    fontSize: 16,
  },
  sectionSub: {
    ...Type.caption,
    color: Colors.text3,
    marginTop: -4,
  },
  seeAll: {
    ...Type.caption,
    color: Colors.gold,
    fontSize: 12,
  },
  achievementScroll: {
    gap: 8,
  },
  achievementBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 24,
  },
  navCard: {},
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '500',
    flex: 1,
  },
  navArrow: {
    color: Colors.text3,
    fontSize: 20,
  },
  searchCard: {
    padding: 14,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    ...Type.body,
    color: Colors.text1,
    fontSize: 14,
    backgroundColor: Colors.glass1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  searchBtn: {
    backgroundColor: Colors.goldDim,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  searchBtnText: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 11,
  },
  searchResult: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    paddingTop: 12,
  },
  searchResultName: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '600',
  },
  searchResultUser: {
    ...Type.caption,
    color: Colors.text3,
  },
  addFriendBtn: {
    marginTop: 8,
    backgroundColor: Colors.goldDim,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  addFriendBtnText: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 11,
  },
  pendingSection: {
    gap: 8,
  },
  pendingLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
    letterSpacing: 2,
  },
  pendingCard: {
    padding: 14,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingInfo: {
    gap: 2,
  },
  pendingName: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '600',
    fontSize: 14,
  },
  pendingUser: {
    ...Type.caption,
    color: Colors.text3,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: Colors.goldDim,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  acceptBtnText: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 10,
  },
  declineBtn: {
    backgroundColor: Colors.glass1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  declineBtnText: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
  },
  friendsList: {
    gap: 8,
  },
  friendCard: {
    padding: 12,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '500',
    fontSize: 14,
  },
  friendSessions: {
    ...Type.caption,
    color: Colors.text3,
    fontSize: 11,
  },
  friendScore: {
    ...Type.mono,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  notifRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  notifLabel: {
    ...Type.body,
    color: Colors.text1,
    fontSize: 14,
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    ...Type.body,
    color: Colors.red,
  },
  emptyText: {
    ...Type.caption,
    color: Colors.text3,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  bottomPad: {
    height: 100,
  },
});
