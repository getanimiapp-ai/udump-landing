import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, unit, highlight }: StatCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, highlight && styles.valueGold]}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 100,
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 4,
  },
  label: {
    ...Type.label,
    color: Colors.text3,
    fontSize: 10,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    ...Type.mono,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text1,
  },
  valueGold: {
    color: Colors.gold,
  },
  unit: {
    ...Type.caption,
    color: Colors.text3,
  },
});
