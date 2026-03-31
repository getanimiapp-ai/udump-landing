import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoldButton } from '../../components/ui/GoldButton';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

export default function ThroneNameScreen() {
  const router = useRouter();
  const [throneName, setThroneName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const name = throneName.trim() || 'Home Throne';
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('thrones').insert({
        name,
        owner_user_id: user.id,
        current_king_id: user.id,
        is_home: true,
      });
    }

    setIsLoading(false);
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="crown" size={64} color={Colors.gold} />
        <Text style={styles.title}>Name your throne.</Text>
        <Text style={styles.subtitle}>
          Give your home toilet a name. Optional, but encouraged.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>THRONE NAME</Text>
            <TextInput
              style={styles.input}
              value={throneName}
              onChangeText={setThroneName}
              placeholder="The Royal Chamber"
              placeholderTextColor={Colors.text3}
              autoCapitalize="words"
              maxLength={40}
            />
          </View>

          <GoldButton
            label={isLoading ? 'REGISTERING...' : 'REGISTER THRONE'}
            onPress={handleRegister}
            disabled={isLoading}
          />

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 12,
  },
  crown: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    ...Type.display,
    fontSize: 32,
    color: Colors.text1,
  },
  subtitle: {
    ...Type.body,
    color: Colors.text3,
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...Type.label,
    color: Colors.text3,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text1,
    fontSize: 16,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    ...Type.body,
    color: Colors.text3,
  },
});
