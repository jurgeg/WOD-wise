import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Colors } from '@/lib/constants';
import { Spacing, BorderRadius } from '@/lib/design';
import { getSession } from '@/lib/supabase';
import { useOnboardingStore } from '@/store/onboarding';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const hydrateFromSupabase = useOnboardingStore((s) => s.hydrateFromSupabase);
  const profileLoaded = useOnboardingStore((s) => s._profileLoaded);

  useEffect(() => {
    if (profileLoaded) return;

    const loadProfile = async () => {
      const { session } = await getSession();
      if (session) {
        await hydrateFromSupabase();
      }
    };

    loadProfile();
  }, [profileLoaded, hydrateFromSupabase]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
          // Shadow for depth
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'WOD',
          tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
          tabBarAccessibilityLabel: 'Analyze a workout',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          tabBarAccessibilityLabel: 'Workout history',
          headerTitle: 'Workout History',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          tabBarAccessibilityLabel: 'Your profile and settings',
          headerTitle: 'My Profile',
        }}
      />
    </Tabs>
  );
}
