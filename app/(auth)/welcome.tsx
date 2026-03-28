import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';
import { GoldButton } from '../../components/ui/GoldButton';

const { width } = Dimensions.get('window');

const PANELS = [
  {
    id: '1',
    title: 'U·DUMP',
    lines: [
      'Originally conceived 2016.',
      'Finally shipped 2026.',
      "You're welcome.",
    ],
    cta: null,
  },
  {
    id: '2',
    title: null,
    lines: [
      'Every room in the house has gone smart.',
      'Every room except one.',
      '',
      'Until now.',
    ],
    cta: null,
  },
  {
    id: '3',
    title: 'Track. Compete. Claim.',
    lines: [],
    features: [
      { icon: '📊', label: 'Log every session with precision' },
      { icon: '👑', label: 'Claim thrones. Defeat your friends.' },
      { icon: '🏆', label: 'Compete on the global leaderboard' },
    ],
    cta: 'create_account',
  },
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
          <View style={[styles.panel]}>
            <SafeAreaView style={styles.panelContent}>
              {item.id === '1' && (
                <View style={styles.splashContent}>
                  <Text style={styles.wordmark}>{item.title}</Text>
                  {item.lines.map((line, i) => (
                    <Text key={i} style={styles.splashLine}>{line}</Text>
                  ))}
                  <View style={styles.ctaRow}>
                    <GoldButton label="BEGIN" onPress={goNext} style={styles.beginBtn} />
                  </View>
                </View>
              )}

              {item.id === '2' && (
                <View style={styles.pitchContent}>
                  {item.lines.map((line, i) => (
                    <Text key={i} style={line === '' ? styles.spacer : styles.pitchLine}>
                      {line}
                    </Text>
                  ))}
                  <View style={styles.toiletEmoji}>
                    <Text style={styles.toiletIcon}>🚽</Text>
                  </View>
                  <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
                    <Text style={styles.nextBtnText}>Continue →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.id === '3' && (
                <View style={styles.setupContent}>
                  <Text style={styles.pitchTitle}>{item.title}</Text>
                  <View style={styles.features}>
                    {(item.features ?? []).map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Text style={styles.featureIcon}>{f.icon}</Text>
                        <Text style={styles.featureLabel}>{f.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.authButtons}>
                    <GoldButton
                      label="CREATE ACCOUNT"
                      onPress={() => router.push('/(auth)/signup')}
                      style={styles.authBtn}
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
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  wordmark: {
    ...Type.display,
    fontSize: 72,
    color: Colors.gold,
    letterSpacing: -2,
    marginBottom: 24,
  },
  splashLine: {
    ...Type.body,
    color: Colors.text2,
    textAlign: 'center',
    fontSize: 17,
  },
  ctaRow: {
    marginTop: 40,
    width: '100%',
  },
  beginBtn: {
    width: '100%',
  },
  pitchContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  pitchLine: {
    ...Type.display,
    fontSize: 28,
    color: Colors.text1,
    lineHeight: 36,
  },
  spacer: {
    height: 8,
  },
  toiletEmoji: {
    marginTop: 8,
  },
  toiletIcon: {
    fontSize: 48,
  },
  nextBtn: {
    marginTop: 32,
    alignSelf: 'flex-start',
  },
  nextBtnText: {
    ...Type.body,
    color: Colors.gold,
    fontSize: 17,
  },
  pitchTitle: {
    ...Type.display,
    fontSize: 28,
    color: Colors.text1,
    marginBottom: 8,
  },
  setupContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureLabel: {
    ...Type.body,
    color: Colors.text2,
    flex: 1,
  },
  authButtons: {
    gap: 12,
  },
  authBtn: {
    width: '100%',
  },
  loginBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginBtnText: {
    ...Type.body,
    color: Colors.text3,
  },
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
    backgroundColor: Colors.text3,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 20,
  },
});
