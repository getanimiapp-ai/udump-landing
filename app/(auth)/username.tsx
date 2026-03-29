import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GoldButton } from '../../components/ui/GoldButton';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

export default function UsernameScreen() {
  const router = useRouter();
  const { fetchProfile } = useUserStore();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Required', 'Please choose a username.');
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      Alert.alert(
        'Invalid username',
        'Usernames must be 3-20 characters: letters, numbers, and underscores only.'
      );
      return;
    }

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Check availability (exclude own profile)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .neq('id', user.id)
      .single();

    if (existing) {
      Alert.alert('Username taken', 'That username is already in use. Try another.');
      setIsLoading(false);
      return;
    }

    // Update profile (trigger may have auto-created it on signup)
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        username: trimmed,
        display_name: user.user_metadata.display_name ?? trimmed,
      },
      { onConflict: 'id' }
    );

    if (error) {
      Alert.alert('Error', 'Failed to save username. Try again.');
      setIsLoading(false);
      return;
    }

    await fetchProfile(user.id);
    setIsLoading(false);
    router.push('/(auth)/throne-name');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Choose your throne name.</Text>
          <Text style={styles.subtitle}>
            This is how you&apos;ll appear on leaderboards and in alerts.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="yourname"
                  placeholderTextColor={Colors.text3}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>
              <Text style={styles.hint}>3-20 characters. Letters, numbers, underscores.</Text>
            </View>

            <GoldButton
              label={isLoading ? 'CLAIMING...' : 'CLAIM THIS NAME'}
              onPress={handleContinue}
              disabled={isLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 12,
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
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...Type.label,
    color: Colors.text3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 16,
  },
  atSign: {
    color: Colors.text3,
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: Colors.text1,
    fontSize: 16,
  },
  hint: {
    ...Type.caption,
    color: Colors.text3,
  },
});
