import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  size?: 'lg' | 'md';
  style?: ViewStyle;
  disabled?: boolean;
}

export function GoldButton({ label, onPress, size = 'lg', style, disabled }: GoldButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <LinearGradient
      colors={['#C9A030', '#F0CE60']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradient, size === 'lg' ? styles.lg : styles.md, style, disabled && styles.disabled]}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={styles.touchable}
        activeOpacity={0.85}
      >
        <Text style={[styles.label, size === 'lg' ? styles.labelLg : styles.labelMd]}>
          {label}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  lg: {
    height: 56,
  },
  md: {
    height: 44,
  },
  disabled: {
    opacity: 0.5,
  },
  touchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#000',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  labelLg: {
    fontSize: 17,
  },
  labelMd: {
    fontSize: 15,
  },
});
