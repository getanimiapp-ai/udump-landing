import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  style?: TextStyle | TextStyle[];
  suffix?: string;
  prefix?: string;
  hapticOnComplete?: boolean;
  bounce?: boolean;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 800,
  style,
  suffix = '',
  prefix = '',
  hapticOnComplete = false,
  bounce = false,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const scale = useSharedValue(1);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        if (bounce) {
          scale.value = withSequence(
            withSpring(1.08, { damping: 14, stiffness: 300 }),
            withSpring(1, { damping: 16, stiffness: 200 }),
          );
        }
        if (hapticOnComplete) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    };

    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <Animated.Text style={[style, animStyle]}>
      {prefix}{formatted}{suffix}
    </Animated.Text>
  );
}
