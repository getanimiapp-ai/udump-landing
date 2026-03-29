import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/lib/store/user.store';
import { Session } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Colors } from '../constants/colors';
import {
  configureNotifications,
  registerForPushNotifications,
} from '../lib/utils/notifications';

configureNotifications();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setProfile, fetchProfile } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  const [fontsLoaded] = useFonts({
    'BarlowCondensed-Bold': require('../assets/fonts/BarlowCondensed-Bold.ttf'),
    'BarlowCondensed-Light': require('../assets/fonts/BarlowCondensed-Light.ttf'),
    'BarlowCondensed-SemiBold': require('../assets/fonts/BarlowCondensed-SemiBold.ttf'),
    'Barlow-Regular': require('../assets/fonts/Barlow-Regular.ttf'),
    'Barlow-Medium': require('../assets/fonts/Barlow-Medium.ttf'),
    'Barlow-SemiBold': require('../assets/fonts/Barlow-SemiBold.ttf'),
    'DMMono-Regular': require('../assets/fonts/DMMono-Regular.ttf'),
    'DMMono-Medium': require('../assets/fonts/DMMono-Medium.ttf'),
  });

  // Deep link handler: route to the right screen based on notification data
  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const type = data?.type as string | undefined;

        switch (type) {
          case 'record_broken':
          case 'throne_claimed':
          case 'throne_lost':
            router.push('/profile/analytics');
            break;
          case 'overstay_60':
          case 'overstay_120':
            router.push('/(tabs)/activity');
            break;
          case 'friend_active':
            router.push('/(tabs)/activity');
            break;
          case 'streak_milestone':
            router.push('/profile/achievements');
            break;
          default:
            break;
        }
      });

    return () => {
      notificationResponseListener.current?.remove();
    };
  }, [router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Register push token whenever auth state changes to a valid session
          registerForPushNotifications(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading]);

  if (isLoading || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.void }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.base } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session/pre" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="session/active" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="session/results" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="profile/achievements" />
        <Stack.Screen name="profile/analytics" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
