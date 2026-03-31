import { Link, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <MaterialCommunityIcons name="crown" size={48} color={Colors.gold} />
        <Text style={styles.heading}>Throne not found.</Text>
        <Text style={styles.body}>This screen doesn&apos;t exist.</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Return to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 64,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text1,
  },
  body: {
    fontSize: 15,
    color: Colors.text3,
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: '500',
  },
});
