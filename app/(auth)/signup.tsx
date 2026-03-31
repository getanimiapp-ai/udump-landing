import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GoldButton } from '../../components/ui/GoldButton';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/typography';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('Signup failed', error.message);
      return;
    }

    router.push('/(auth)/username');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Join U·Dump.</Text>
          <Text style={styles.subtitle}>You were born for this.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DISPLAY NAME</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Aaron"
                placeholderTextColor={Colors.text3}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.text3}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="8+ characters"
                placeholderTextColor={Colors.text3}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <GoldButton
              label={isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              onPress={handleSignup}
              disabled={isLoading}
              style={styles.submitBtn}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backText: {
    ...Type.body,
    color: Colors.gold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    ...Type.display,
    fontSize: 36,
    color: Colors.text1,
  },
  subtitle: {
    ...Type.body,
    color: Colors.text3,
    marginBottom: 32,
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
  submitBtn: {
    marginTop: 8,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    ...Type.body,
    color: Colors.text3,
  },
  loginLinkHighlight: {
    color: Colors.gold,
  },
});
