import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

type BadgeColor = 'gold' | 'red' | 'green' | 'blue' | 'default';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

const COLOR_MAP: Record<BadgeColor, { bg: string; text: string; border: string }> = {
  gold: {
    bg: Colors.goldDim,
    text: Colors.gold,
    border: 'rgba(212,175,55,0.3)',
  },
  red: {
    bg: 'rgba(255,59,48,0.12)',
    text: Colors.red,
    border: 'rgba(255,59,48,0.3)',
  },
  green: {
    bg: 'rgba(48,209,88,0.12)',
    text: Colors.green,
    border: 'rgba(48,209,88,0.3)',
  },
  blue: {
    bg: 'rgba(10,132,255,0.12)',
    text: Colors.blue,
    border: 'rgba(10,132,255,0.3)',
  },
  default: {
    bg: Colors.glass2,
    text: Colors.text2,
    border: Colors.glassBorder,
  },
};

export function Badge({ label, color = 'default' }: BadgeProps) {
  const colors = COLOR_MAP[color];
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...Type.label,
    fontSize: 9,
    letterSpacing: 1,
  },
});
