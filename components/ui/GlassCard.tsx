import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  innerStyle?: ViewStyle;
  gold?: boolean;
}

export function GlassCard({ children, style, intensity = 20, innerStyle, gold }: GlassCardProps) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.card, gold && styles.goldBorder, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  goldBorder: {
    borderColor: Colors.goldDim,
  },
  inner: {
    flex: 1,
  },
});
