import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

const THRONE_WISDOM = [
  'Champions do not rush greatness.',
  'Your throne awaits. Leave a legend.',
  'Bobby set the bar. Destroy it.',
  'Statistics show winners sit longer.',
  'Hydrate. Focus. Execute.',
  'The crown rewards the patient.',
  'This is not a race. It is an art.',
  'Every session is a statement.',
];

function getRandomWisdom(): string {
  return THRONE_WISDOM[Math.floor(Math.random() * THRONE_WISDOM.length)];
}

export default function PreSessionScreen() {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(3);
  const [wisdom] = useState(getRandomWisdom());
  const numberScale = useSharedValue(1);
  const numberOpacity = useSharedValue(1);
  const crownScale = useSharedValue(0);
  const crownOpacity = useSharedValue(0);
  const wisdomOpacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
    opacity: numberOpacity.value,
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
    opacity: crownOpacity.value,
  }));

  const wisdomStyle = useAnimatedStyle(() => ({
    opacity: wisdomOpacity.value,
  }));

  const animateBeat = () => {
    numberScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    numberOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0.7, { duration: 700 }),
      withTiming(1, { duration: 250 })
    );
  };

  useEffect(() => {
    wisdomOpacity.value = withTiming(1, { duration: 600 });

    // First beat immediately
    animateBeat();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    let current = 3;

    timerRef.current = setInterval(() => {
      current -= 1;

      if (current === 0) {
        clearInterval(timerRef.current!);
        setCount(null);
        // Crown reveal
        crownScale.value = withSpring(1, { damping: 8, stiffness: 200 });
        crownOpacity.value = withTiming(1, { duration: 300 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          router.replace('/session/active');
        }, 800);
      } else {
        setCount(current);
        animateBeat();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.counterArea}>
            {count !== null ? (
              <Animated.Text style={[styles.countNumber, numberStyle]}>
                {count}
              </Animated.Text>
            ) : (
              <Animated.Text style={[styles.crownEmoji, crownStyle]}>
                👑
              </Animated.Text>
            )}
          </View>

          <Animated.View style={[styles.wisdomContainer, wisdomStyle]}>
            <Text style={styles.wisdomLabel}>THRONE WISDOM</Text>
            <Text style={styles.wisdomText}>{wisdom}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 80,
  },
  counterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNumber: {
    ...Type.mono,
    fontSize: 160,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: -8,
    lineHeight: 180,
  },
  crownEmoji: {
    fontSize: 120,
    lineHeight: 140,
  },
  wisdomContainer: {
    alignItems: 'center',
    gap: 8,
  },
  wisdomLabel: {
    ...Type.label,
    color: Colors.text3,
    letterSpacing: 2,
  },
  wisdomText: {
    ...Type.body,
    color: Colors.text2,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
