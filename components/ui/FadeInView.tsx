import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  slideFrom?: 'bottom' | 'left' | 'right' | 'none';
  slideDistance?: number;
  style?: ViewStyle | ViewStyle[];
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  slideFrom = 'bottom',
  slideDistance = 20,
  style,
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(
    slideFrom === 'left' ? -slideDistance : slideFrom === 'right' ? slideDistance : 0
  );
  const translateY = useSharedValue(slideFrom === 'bottom' ? slideDistance : 0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    if (slideFrom === 'bottom') {
      translateY.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }));
    } else if (slideFrom === 'left' || slideFrom === 'right') {
      translateX.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
}
