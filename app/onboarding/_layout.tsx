import { Stack } from 'expo-router';
import { Colors } from '@/lib/constants';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: Colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Welcome',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="experience"
        options={{
          title: 'Experience Level',
        }}
      />
      <Stack.Screen
        name="skills"
        options={{
          title: 'Movement Skills',
        }}
      />
      <Stack.Screen
        name="strength"
        options={{
          title: 'Strength Numbers',
        }}
      />
      <Stack.Screen
        name="limitations"
        options={{
          title: 'Limitations',
        }}
      />
    </Stack>
  );
}
