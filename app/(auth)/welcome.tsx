import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';
import { GoldButton } from '../../components/ui/GoldButton';

const { width } = Dimensions.get('window');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const foundersImage = require('../../assets/founders.png');

const PANELS = [
  { id: '1' },
  { id: '2' },
  { id: '3' },
  { id: '4' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const goNext = () => {
    if (currentIndex < PANELS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.void, Colors.base]}
        style={StyleSheet.absoluteFillObject}
      />

      <FlatList
        ref={flatListRef}
        data={PANELS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.panel}>
            <SafeAreaView style={styles.panelContent}>

              {/* ── Panel 1: The Hook ── */}
              {item.id === '1' && (
                <View style={styles.centerContent}>
                  <Text style={styles.bigEmoji}>🚽</Text>
                  <View style={styles.linesBlock}>
                    <Text style={styles.pitchLine}>You{"'"}ve tracked your steps.</Text>
                    <Text style={styles.pitchLine}>Your sleep. Your calories.</Text>
                    <Text style={styles.spacer}>{' '}</Text>
                    <Text style={styles.pitchLine}>But never your most</Text>
                    <Text style={styles.pitchLineGold}>important output.</Text>
                  </View>
                  <View style={styles.ctaRow}>
                    <GoldButton label="GO ON..." onPress={goNext} />
                  </View>
                </View>
              )}

              {/* ── Panel 2: The Sell ── */}
              {item.id === '2' && (
                <View style={styles.centerContent}>
                  <View style={styles.linesBlock}>
                    <Text style={styles.sellLine}>Weigh your contributions</Text>
                    <Text style={styles.sellLine}>to society.</Text>
                    <Text style={styles.spacer}>{' '}</Text>
                    <Text style={styles.sellLine}>Claim your friends{"'"} toilets.</Text>
                    <Text style={styles.spacer}>{' '}</Text>
                    <Text style={styles.sellLine}>Dethrone the people</Text>
                    <Text style={styles.sellLine}>you love.</Text>
                  </View>
                  <Text style={styles.tagline}>
                    Originally conceived 2016.{'\n'}Finally shipped 2026.
                  </Text>
                  <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
                    <Text style={styles.nextBtnText}>I{"'"}m listening →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Panel 3: Features + CTA ── */}
              {item.id === '3' && (
                <View style={styles.setupContent}>
                  <Text style={styles.ctaTitle}>Take Your Rightful Seat</Text>
                  <View style={styles.features}>
                    <View style={styles.featureRow}>
                      <Ionicons name="analytics-outline" size={24} color={Colors.gold} />
                      <Text style={styles.featureLabel}>Log every session with scientific precision</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons name="trophy-outline" size={24} color={Colors.gold} />
                      <Text style={styles.featureLabel}>Claim thrones. Humiliate your friends.</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons name="podium-outline" size={24} color={Colors.gold} />
                      <Text style={styles.featureLabel}>Rise on the global leaderboard</Text>
                    </View>
                  </View>
                  <View style={styles.authButtons}>
                    <GoldButton
                      label="CREATE ACCOUNT"
                      onPress={() => router.push('/(auth)/signup')}
                    />
                    <TouchableOpacity
                      style={styles.loginBtn}
                      onPress={() => router.push('/(auth)/login')}
                    >
                      <Text style={styles.loginBtnText}>I already have an account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── Panel 4: Founders ── */}
              {item.id === '4' && (
                <View style={styles.foundersContent}>
                  <Text style={styles.foundersLabel}>A MESSAGE FROM OUR FOUNDERS</Text>
                  <Image
                    source={foundersImage}
                    style={styles.foundersImage}
                    resizeMode="contain"
                  />
                  <View style={styles.foundersNames}>
                    <Text style={styles.founderName}>Nick</Text>
                    <Text style={styles.founderName}>Aaron</Text>
                    <Text style={styles.founderName}>Shelden</Text>
                  </View>
                  <Text style={styles.foundersQuote}>
                    Thank you for being an early believer in what we{"'"}re building. We vow to make your bathroom experience
                    the most tracked, most competitive, and most dignified part of your day.
                  </Text>
                  <Text style={styles.foundersQuote}>
                    Every flush is a data point. Every session, a step toward greatness. We built this for you — and honestly,
                    for ourselves. We needed this.
                  </Text>
                  <Text style={styles.foundersSig}>— The U·Dump Founding Team</Text>
                  <View style={styles.authButtons}>
                    <GoldButton
                      label={"LET'S GO"}
                      onPress={() => router.push('/(auth)/signup')}
                    />
                    <TouchableOpacity
                      style={styles.loginBtn}
                      onPress={() => router.push('/(auth)/login')}
                    >
                      <Text style={styles.loginBtnText}>I already have an account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </SafeAreaView>
          </View>
        )}
      />

      <View style={styles.dots}>
        {PANELS.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  panel: {
    width,
    flex: 1,
  },
  panelContent: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Panel 1: Hook ──
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  bigEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  linesBlock: {
    alignItems: 'center',
  },
  pitchLine: {
    fontFamily: Fonts.displayFamily,
    fontSize: 22,
    color: Colors.text1,
    textAlign: 'center',
    lineHeight: 32,
  },
  pitchLineGold: {
    fontFamily: Fonts.displayFamily,
    fontSize: 22,
    color: Colors.gold,
    textAlign: 'center',
    lineHeight: 32,
  },
  spacer: {
    height: 12,
  },
  ctaRow: {
    marginTop: 16,
    width: '100%',
  },

  // ── Panel 2: Sell ──
  sellLine: {
    fontFamily: Fonts.displayFamily,
    fontSize: 26,
    color: Colors.text1,
    lineHeight: 36,
    textAlign: 'center',
  },
  tagline: {
    ...Type.body,
    color: Colors.text3,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: 8,
  },
  nextBtn: {
    marginTop: 16,
    alignSelf: 'center',
  },
  nextBtnText: {
    ...Type.body,
    color: Colors.gold,
    fontSize: 17,
  },

  // ── Panel 3: Features ──
  setupContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  ctaTitle: {
    fontFamily: Fonts.displayFamily,
    fontSize: 28,
    color: Colors.text1,
    marginBottom: 4,
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureLabel: {
    ...Type.body,
    color: Colors.text2,
    flex: 1,
  },
  authButtons: {
    gap: 12,
    marginTop: 8,
  },
  loginBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginBtnText: {
    ...Type.body,
    color: Colors.text3,
  },

  // ── Panel 4: Founders ──
  foundersContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  foundersLabel: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  foundersImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    alignSelf: 'center',
  },
  foundersNames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  founderName: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 13,
    color: Colors.text2,
    letterSpacing: 0.5,
  },
  foundersQuote: {
    ...Type.body,
    color: Colors.text2,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  foundersSig: {
    ...Type.body,
    color: Colors.gold,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Dots ──
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 32,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.glass3,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 24,
    height: 6,
    borderRadius: 3,
  },
});
