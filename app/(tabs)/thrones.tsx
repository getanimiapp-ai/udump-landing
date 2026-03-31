import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { MOCK_ENABLED, MOCK_PROFILE, MOCK_THRONES } from '../../lib/mock-data';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle as MapCircle, Marker, Region } from 'react-native-maps';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FadeInView } from '../../components/ui/FadeInView';
import { GlassCard } from '../../components/ui/GlassCard';
import { GoldButton } from '../../components/ui/GoldButton';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_GAP = 12;
const TERRITORY_RADIUS_M = 50; // 50m geofence

interface Throne {
  id: string;
  name: string;
  owner_user_id: string | null;
  current_king_id: string | null;
  current_king_weight_lbs: number | null;
  lat: number | null;
  lng: number | null;
  is_home: boolean;
  kingUsername?: string;
  ownerUsername?: string;
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0c0c12' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#06060a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a22' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06060a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function ThronesScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);
  const [thrones, setThrones] = useState<Throne[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [region, setRegion] = useState<Region>({
    latitude: 39.7684,
    longitude: -86.1581,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const displayProfile = MOCK_ENABLED ? MOCK_PROFILE : profile;

  const fetchThrones = useCallback(async () => {
    if (MOCK_ENABLED) {
      setThrones(MOCK_THRONES);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Only show thrones from friends + own thrones
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    const friendIds = [user.id, ...(friendships ?? []).map((f) => f.friend_id)];

    const { data } = await supabase
      .from('thrones')
      .select('*, profiles!thrones_current_king_id_fkey(username)')
      .in('owner_user_id', friendIds)
      .not('lat', 'is', null);

    if (data) {
      setThrones(data.map((t) => ({
        ...t,
        kingUsername: (t.profiles as { username: string } | null)?.username,
      })));
    }
  }, []);

  useEffect(() => {
    fetchThrones();
    requestLocation();
  }, [fetchThrones]);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;
    setUserLocation({ lat: latitude, lng: longitude });
    setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  };

  const distanceTo = (lat: number, lng: number): number => {
    if (!userLocation) return Infinity;
    const R = 6371000;
    const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
    const dLon = ((lng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const canClaim = (throne: Throne): boolean => {
    if (!throne.lat || !throne.lng) return false;
    return distanceTo(throne.lat, throne.lng) <= TERRITORY_RADIUS_M;
  };

  const handleClaim = (throne: Throne) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      `Claim ${throne.name}?`,
      'You\'re within range. Start a session here to claim this throne and dethrone the current king.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Start Session',
          onPress: () => router.push('/session/pre'),
        },
      ]
    );
  };

  const handleChallenge = (throne: Throne) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `Challenge ${throne.kingUsername ?? 'the King'}?`,
      `Send a challenge notification to the current ruler of ${throne.name}. They\'ll know you\'re coming.`,
      [
        { text: 'Nevermind', style: 'cancel' },
        {
          text: 'Send Challenge',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Challenge Sent', `${throne.kingUsername ?? 'The king'} has been notified. The throne awaits.`);
          },
        },
      ]
    );
  };

  const onCardScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (CARD_WIDTH + CARD_GAP));
    if (idx !== selectedIndex && idx >= 0 && idx < thrones.length) {
      setSelectedIndex(idx);
      Haptics.selectionAsync();
      const throne = thrones[idx];
      if (throne.lat && throne.lng) {
        mapRef.current?.animateToRegion({
          latitude: throne.lat,
          longitude: throne.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 400);
      }
    }
  };

  const selectThrone = (idx: number) => {
    setSelectedIndex(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    const throne = thrones[idx];
    if (throne.lat && throne.lng) {
      Haptics.selectionAsync();
      mapRef.current?.animateToRegion({
        latitude: throne.lat,
        longitude: throne.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 400);
    }
  };

  const myThrones = thrones.filter((t) => t.current_king_id === displayProfile?.id);
  const contestedThrones = thrones.filter(
    (t) => t.owner_user_id === displayProfile?.id && t.current_king_id !== displayProfile?.id
  );

  const getTerritoryColor = (throne: Throne): string => {
    if (throne.current_king_id === displayProfile?.id) return 'rgba(212,175,55,0.15)';
    if (throne.owner_user_id === displayProfile?.id) return 'rgba(255,59,48,0.12)';
    return 'rgba(255,255,255,0.06)';
  };

  const getTerritoryStroke = (throne: Throne): string => {
    if (throne.current_king_id === displayProfile?.id) return 'rgba(212,175,55,0.4)';
    if (throne.owner_user_id === displayProfile?.id) return 'rgba(255,59,48,0.3)';
    return 'rgba(255,255,255,0.12)';
  };

  const renderThroneCard = ({ item, index }: { item: Throne; index: number }) => {
    const isSelected = index === selectedIndex;
    const isMine = item.current_king_id === displayProfile?.id;
    const isContested = item.owner_user_id === displayProfile?.id && !isMine;
    const dist = item.lat && item.lng ? distanceTo(item.lat, item.lng) : null;
    const withinRange = canClaim(item);

    return (
      <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
        <GlassCard
          style={[styles.throneCard, isSelected && styles.throneCardSelected]}
          gold={isMine}
          intensity={60}
        >
          <View style={styles.throneCardContent}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.throneIcon}>
                  {isMine ? '👑' : isContested ? '⚔️' : '🏰'}
                </Text>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.throneName} numberOfLines={1}>{item.name}</Text>
                  {item.is_home && (
                    <View style={styles.homeBadge}>
                      <Text style={styles.homeBadgeText}>HOME</Text>
                    </View>
                  )}
                </View>
              </View>
              {dist != null && dist < 10000 && (
                <Text style={styles.distText}>
                  {dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`}
                </Text>
              )}
            </View>

            {/* Current King */}
            <View style={styles.kingSection}>
              <Text style={styles.kingLabel}>CURRENT KING</Text>
              <Text style={[styles.kingName, isMine && styles.kingNameGold]}>
                {isMine ? 'You reign here' : item.kingUsername ?? 'Unclaimed'}
              </Text>
              {item.current_king_weight_lbs != null && (
                <Text style={styles.kingRecord}>
                  Record: {item.current_king_weight_lbs.toFixed(2)} lbs
                </Text>
              )}
            </View>

            {/* Status Badge */}
            <View style={styles.statusRow}>
              {isMine && (
                <View style={styles.statusBadgeGold}>
                  <Ionicons name="shield-checkmark" size={12} color={Colors.gold} />
                  <Text style={styles.statusTextGold}>YOUR TERRITORY</Text>
                </View>
              )}
              {isContested && (
                <View style={styles.statusBadgeRed}>
                  <Ionicons name="alert-circle" size={12} color={Colors.red} />
                  <Text style={styles.statusTextRed}>CONTESTED</Text>
                </View>
              )}
              {!isMine && !isContested && item.current_king_id && (
                <View style={styles.statusBadgeNeutral}>
                  <Ionicons name="flag" size={12} color={Colors.text3} />
                  <Text style={styles.statusTextNeutral}>ENEMY TERRITORY</Text>
                </View>
              )}
              {!item.current_king_id && (
                <View style={styles.statusBadgeGold}>
                  <Ionicons name="flag-outline" size={12} color={Colors.gold} />
                  <Text style={styles.statusTextGold}>UNCLAIMED</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.cardActions}>
              {withinRange && !isMine && (
                <GoldButton
                  label="CLAIM THRONE"
                  onPress={() => handleClaim(item)}
                  size="md"
                  style={styles.claimBtn}
                />
              )}
              {!isMine && item.current_king_id && (
                <TouchableOpacity
                  onPress={() => handleChallenge(item)}
                  style={styles.challengeBtn}
                >
                  <Ionicons name="flash" size={14} color={Colors.gold} />
                  <Text style={styles.challengeBtnText}>CHALLENGE</Text>
                </TouchableOpacity>
              )}
              {isMine && (
                <View style={styles.defendBadge}>
                  <Ionicons name="shield" size={14} color={Colors.gold} />
                  <Text style={styles.defendText}>DEFENDING</Text>
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Territory boundary circles */}
        {thrones.filter((t) => t.lat && t.lng).map((throne) => (
          <MapCircle
            key={`territory-${throne.id}`}
            center={{ latitude: throne.lat!, longitude: throne.lng! }}
            radius={TERRITORY_RADIUS_M}
            fillColor={getTerritoryColor(throne)}
            strokeColor={getTerritoryStroke(throne)}
            strokeWidth={1.5}
          />
        ))}

        {/* Throne markers */}
        {thrones.filter((t) => t.lat && t.lng).map((throne, idx) => (
          <Marker
            key={throne.id}
            coordinate={{ latitude: throne.lat!, longitude: throne.lng! }}
            onPress={() => selectThrone(idx)}
          >
            <View style={[
              styles.pin,
              throne.current_king_id === displayProfile?.id && styles.pinMine,
            ]}>
              <Text style={styles.pinIcon}>
                {throne.current_king_id === displayProfile?.id
                  ? '👑'
                  : throne.owner_user_id === displayProfile?.id
                    ? '⚔️'
                    : '🏰'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Header */}
      <SafeAreaView style={styles.floatingHeader} pointerEvents="box-none">
        <FadeInView delay={0}>
          <BlurView intensity={40} tint="dark" style={styles.headerBar}>
            <View style={styles.headerCard}>
              <Text style={{ fontSize: 14 }}>👑</Text>
              <Text style={styles.headerTitle}>YOUR EMPIRE</Text>
            </View>
            <View style={styles.headerStatsRow}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatNum}>{myThrones.length}</Text>
                <Text style={styles.headerStatLabel}>held</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={[styles.headerStatNum, contestedThrones.length > 0 && styles.headerStatNumRed]}>
                  {contestedThrones.length}
                </Text>
                <Text style={styles.headerStatLabel}>contested</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatNum}>{thrones.length}</Text>
                <Text style={styles.headerStatLabel}>total</Text>
              </View>
            </View>
          </BlurView>
        </FadeInView>
      </SafeAreaView>

      {/* Swipeable Throne Cards */}
      <View style={styles.cardCarousel}>
        {thrones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={32} color={Colors.goldDim} />
            <Text style={styles.emptyTitle}>No thrones in your territory.</Text>
            <Text style={styles.emptySub}>Add friends or claim a throne to start your empire.</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={thrones}
              renderItem={renderThroneCard}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled={false}
              snapToInterval={CARD_WIDTH + CARD_GAP}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              onMomentumScrollEnd={onCardScroll}
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH + CARD_GAP,
                offset: (CARD_WIDTH + CARD_GAP) * index,
                index,
              })}
            />
            {/* Page indicator dots */}
            <View style={styles.dots}>
              {thrones.slice(0, 8).map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === selectedIndex && styles.dotActive]}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  map: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 4,
  },
  headerBar: {
    backgroundColor: 'rgba(6,6,10,0.45)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorderHi,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Fonts.displaySemiBoldFamily,
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.gold,
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  headerStatNum: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 16,
    color: Colors.text1,
  },
  headerStatNumRed: {
    color: Colors.red,
  },
  headerStatLabel: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 11,
    color: Colors.text3,
  },
  headerStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.glassBorder,
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6,6,10,0.7)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  pinMine: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  pinIcon: {
    fontSize: 18,
  },
  cardCarousel: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
  cardList: {
    paddingHorizontal: 32,
    gap: CARD_GAP,
  },
  cardWrapper: {
    // width set inline
  },
  throneCard: {
    backgroundColor: 'rgba(6,6,10,0.88)',
  },
  throneCardSelected: {
    borderColor: Colors.gold,
  },
  throneCardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  throneIcon: {
    fontSize: 22,
  },
  cardTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  throneName: {
    fontFamily: Fonts.displayFamily,
    fontSize: 18,
    letterSpacing: -0.3,
    color: Colors.text1,
    flexShrink: 1,
  },
  homeBadge: {
    backgroundColor: Colors.goldDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  homeBadgeText: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.gold,
  },
  distText: {
    fontFamily: Fonts.monoFamily,
    fontSize: 11,
    color: Colors.text3,
  },
  kingSection: {
    gap: 2,
  },
  kingLabel: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.text3,
  },
  kingName: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 14,
    color: Colors.text1,
  },
  kingNameGold: {
    color: Colors.gold,
  },
  kingRecord: {
    fontFamily: Fonts.monoFamily,
    fontSize: 11,
    color: Colors.text3,
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusBadgeGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.goldDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  statusTextGold: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.gold,
  },
  statusBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
  },
  statusTextRed: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.red,
  },
  statusBadgeNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.glass2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statusTextNeutral: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.text3,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  claimBtn: {
    flex: 1,
  },
  challengeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
  },
  challengeBtnText: {
    fontFamily: Fonts.displaySemiBoldFamily,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.gold,
  },
  defendBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  defendText: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.gold,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.glass2,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.displayFamily,
    fontSize: 16,
    letterSpacing: -0.3,
    color: Colors.text2,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.bodyFamily,
    fontSize: 12,
    color: Colors.text3,
    textAlign: 'center',
  },
});
