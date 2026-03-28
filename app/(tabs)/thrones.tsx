import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { GlassCard } from '../../components/ui/GlassCard';
import { GoldButton } from '../../components/ui/GoldButton';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

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
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06060a' }] },
];

export default function ThronesScreen() {
  const { profile } = useUserStore();
  const mapRef = useRef<MapView>(null);
  const [thrones, setThrones] = useState<Throne[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedThrone, setSelectedThrone] = useState<Throne | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 39.7684,
    longitude: -86.1581,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const fetchThrones = useCallback(async () => {
    const { data } = await supabase
      .from('thrones')
      .select('*, profiles!thrones_current_king_id_fkey(username)')
      .not('lat', 'is', null);

    if (data) {
      const enriched: Throne[] = data.map((t) => ({
        ...t,
        kingUsername: (t.profiles as { username: string } | null)?.username,
      }));
      setThrones(enriched);
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
    return distanceTo(throne.lat, throne.lng) <= 50;
  };

  const handleClaim = async (throne: Throne) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    Alert.alert(
      `Claim ${throne.name}?`,
      `You're within range. Start a session here to claim this throne.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Start Session',
          onPress: () => {
            setSelectedThrone(null);
          },
        },
      ]
    );
  };

  const myThrones = thrones.filter((t) => t.current_king_id === profile?.id);
  const contestedThrones = thrones.filter((t) => t.owner_user_id === profile?.id && t.current_king_id !== profile?.id);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={DARK_MAP_STYLE}
      >
        {thrones.filter((t) => t.lat && t.lng).map((throne) => (
          <Marker
            key={throne.id}
            coordinate={{ latitude: throne.lat!, longitude: throne.lng! }}
            onPress={() => setSelectedThrone(throne)}
            title={throne.name}
          >
            <View style={styles.pin}>
              <Text style={styles.pinIcon}>
                {throne.current_king_id === profile?.id
                  ? '👑'
                  : throne.owner_user_id === profile?.id
                    ? '🔴'
                    : '⚪'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Header */}
      <SafeAreaView style={styles.floatingHeader} pointerEvents="none">
        <GlassCard style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>YOUR EMPIRE</Text>
            <Text style={styles.headerStats}>
              {myThrones.length} held · {contestedThrones.length} contested
            </Text>
          </View>
        </GlassCard>
      </SafeAreaView>

      {/* Throne List Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.throneList}
        >
          {thrones.slice(0, 8).map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => {
                setSelectedThrone(t);
                if (t.lat && t.lng) {
                  setRegion({ latitude: t.lat, longitude: t.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 });
                }
              }}
            >
              <GlassCard style={styles.throneChip}>
                <View style={styles.throneChipContent}>
                  <Text style={styles.throneChipName}>{t.name}</Text>
                  <Text style={styles.throneChipKing}>
                    {t.current_king_id === profile?.id ? 'You' : t.kingUsername ?? 'Unconquered'}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Selected Throne Modal */}
      {selectedThrone && (
        <View style={styles.throneModal}>
          <GlassCard style={styles.throneModalCard} intensity={40}>
            <View style={styles.throneModalContent}>
              <View style={styles.throneModalHeader}>
                <Text style={styles.throneModalName}>{selectedThrone.name}</Text>
                <TouchableOpacity onPress={() => setSelectedThrone(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.throneModalStats}>
                <View style={styles.throneModalStat}>
                  <Text style={styles.throneModalStatLabel}>CURRENT KING</Text>
                  <Text style={styles.throneModalStatValue}>
                    {selectedThrone.current_king_id === profile?.id
                      ? '👑 You'
                      : selectedThrone.kingUsername ?? 'None'}
                  </Text>
                </View>
                {selectedThrone.current_king_weight_lbs && (
                  <View style={styles.throneModalStat}>
                    <Text style={styles.throneModalStatLabel}>RECORD</Text>
                    <Text style={[styles.throneModalStatValue, styles.goldText]}>
                      {selectedThrone.current_king_weight_lbs.toFixed(2)} lbs
                    </Text>
                  </View>
                )}
              </View>
              {canClaim(selectedThrone) && selectedThrone.current_king_id !== profile?.id && (
                <GoldButton
                  label="CLAIM THIS THRONE"
                  onPress={() => handleClaim(selectedThrone)}
                  style={styles.claimBtn}
                />
              )}
              {!canClaim(selectedThrone) && selectedThrone.current_king_id !== profile?.id && (
                <Text style={styles.tooFarText}>
                  Get within 50m to claim this throne.
                </Text>
              )}
            </View>
          </GlassCard>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerCard: {
    alignSelf: 'flex-start',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  headerTitle: {
    ...Type.label,
    color: Colors.gold,
  },
  headerStats: {
    ...Type.caption,
    color: Colors.text2,
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 24,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  throneList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  throneChip: {
    marginRight: 0,
  },
  throneChipContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  throneChipName: {
    ...Type.body,
    color: Colors.text1,
    fontWeight: '600',
    fontSize: 13,
  },
  throneChipKing: {
    ...Type.caption,
    color: Colors.text3,
  },
  throneModal: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  throneModalCard: {},
  throneModalContent: {
    padding: 20,
    gap: 16,
  },
  throneModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  throneModalName: {
    ...Type.display,
    fontSize: 22,
    color: Colors.text1,
    flex: 1,
  },
  closeBtn: {
    color: Colors.text3,
    fontSize: 18,
    padding: 4,
  },
  throneModalStats: {
    flexDirection: 'row',
    gap: 24,
  },
  throneModalStat: {
    gap: 4,
  },
  throneModalStatLabel: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 9,
  },
  throneModalStatValue: {
    ...Type.mono,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text1,
  },
  goldText: {
    color: Colors.gold,
  },
  claimBtn: {},
  tooFarText: {
    ...Type.caption,
    color: Colors.text3,
    textAlign: 'center',
  },
});
