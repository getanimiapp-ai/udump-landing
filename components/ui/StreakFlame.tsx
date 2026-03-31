import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';

interface StreakFlameProps {
  days: number;
  size?: 'sm' | 'lg';
}

export function StreakFlame({ days, size = 'sm' }: StreakFlameProps) {
  const flameScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 600 }),
        withTiming(0.95, { duration: 500 }),
        withTiming(1.05, { duration: 400 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.2, { duration: 800 }),
      ),
      -1,
      true,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const isLg = size === 'lg';
  const isHot = days >= 7;
  const isOnFire = days >= 14;
  const isLegendary = days >= 30;

  return (
    <View style={[styles.container, isLg && styles.containerLg]}>
      <Animated.View style={[styles.glowCircle, isLg && styles.glowCircleLg, glowStyle]} />
      <Animated.View style={flameStyle}>
        {isLegendary
          ? <MaterialCommunityIcons name="crown" size={isLg ? 28 : 18} color={Colors.gold} />
          : <Ionicons name="flame" size={isLg ? 28 : 18} color={isOnFire ? Colors.gold : '#FF9500'} />
        }
      </Animated.View>
      <Text style={[
        styles.count,
        isLg && styles.countLg,
        isOnFire && styles.countGold,
        isLegendary && styles.countLegendary,
      ]}>
        {days}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  containerLg: {
    gap: 6,
  },
  glowCircle: {
    position: 'absolute',
    left: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,149,0,0.25)',
  },
  glowCircleLg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    left: -6,
  },
  flame: {
    fontSize: 18,
  },
  flameLg: {
    fontSize: 28,
  },
  count: {
    fontFamily: Fonts.monoMediumFamily,
    fontSize: 14,
    color: Colors.text1,
  },
  countLg: {
    fontSize: 20,
  },
  countGold: {
    color: Colors.gold,
  },
  countLegendary: {
    color: Colors.goldBright,
  },
});
