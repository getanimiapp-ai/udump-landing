import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  innerStyle?: ViewStyle;
}

export function GlassCard({ children, style, intensity = 20, innerStyle }: GlassCardProps) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.card, style]}>
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inner: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    flex: 1,
  },
});
