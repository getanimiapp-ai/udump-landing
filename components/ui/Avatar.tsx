import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface AvatarProps {
  uri?: string | null;
  username?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ uri, username, size = 40, style }: AvatarProps) {
  const initial = username?.charAt(0).toUpperCase() ?? '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.elevated,
  },
  placeholder: {
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Colors.text2,
    fontWeight: '600',
  },
});
