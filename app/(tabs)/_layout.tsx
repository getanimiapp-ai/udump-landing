import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  iconOutline: IoniconsName;
  iconFilled: IoniconsName;
  label: string;
  focused: boolean;
}

function TabIcon({ iconOutline, iconFilled, label, focused }: TabIconProps) {
  const scale = useSharedValue(1);
  const prevFocused = React.useRef(false);

  useEffect(() => {
    if (focused && !prevFocused.current) {
      scale.value = withSequence(
        withSpring(1.18, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
    prevFocused.current = focused;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.tabItem}>
      <Animated.View style={iconStyle}>
        <Ionicons
          name={focused ? iconFilled : iconOutline}
          size={22}
          color={focused ? Colors.gold : Colors.text3}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]} numberOfLines={1}>{label}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        ),
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.text3,
        tabBarShowLabel: false,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconOutline="home-outline" iconFilled="home" label="HOME" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconOutline="analytics-outline" iconFilled="analytics" label="SCORE" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconOutline="people-outline" iconFilled="people" label="FEED" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="thrones"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconOutline="location-outline" iconFilled="location" label="THRONE" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    backgroundColor: 'transparent',
    elevation: 0,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 4,
  },
  tabLabel: {
    fontFamily: Fonts.displaySemiBoldFamily,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.text3,
  },
  tabLabelFocused: {
    color: Colors.gold,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginTop: 1,
  },
});
