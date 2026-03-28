import { useUserStore } from '@/lib/store/user.store';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useUserStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar
            uri={profile?.avatar_url}
            username={profile?.display_name ?? profile?.username}
            size={80}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.displayName}>{profile?.display_name ?? profile?.username}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            <Text style={styles.dumpScore}>
              Dump Score™ {profile?.dump_score.toFixed(1) ?? '—'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <GlassCard>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.total_sessions ?? 0}</Text>
              <Text style={styles.statLabel}>SESSIONS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.goldText]}>
                {(profile?.total_weight_lbs ?? 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>TOTAL LBS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.streak_days ?? 0}</Text>
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
          </View>
        </GlassCard>

        {/* Navigation */}
        <View style={styles.navList}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/profile/achievements')}
          >
            <GlassCard style={styles.navCard}>
              <View style={styles.navContent}>
                <Text style={styles.navIcon}>🏆</Text>
                <Text style={styles.navLabel}>Achievements</Text>
                <Text style={styles.navArrow}>›</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/profile/analytics')}
          >
            <GlassCard style={styles.navCard}>
              <View style={styles.navContent}>
                <Text style={styles.navIcon}>📊</Text>
                <Text style={styles.navLabel}>Analytics</Text>
                <Text style={styles.navArrow}>›</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
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
    alignItems: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
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
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.glassBorder,
  },
  statValue: {
    ...Type.mono,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text1,
  },
  goldText: {
    color: Colors.gold,
  },
  statLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
  },
  navList: {
    gap: 10,
  },
  navItem: {},
  navCard: {},
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  navIcon: {
    fontSize: 22,
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
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    ...Type.body,
    color: Colors.red,
  },
  bottomPad: {
    height: 100,
  },
});
