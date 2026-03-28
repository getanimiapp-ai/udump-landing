import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Advanced analytics coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
  },
  backBtn: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  backText: {
    ...Type.body,
    color: Colors.gold,
  },
  title: {
    ...Type.display,
    fontSize: 28,
    color: Colors.text1,
  },
  subtitle: {
    ...Type.body,
    color: Colors.text3,
  },
});
