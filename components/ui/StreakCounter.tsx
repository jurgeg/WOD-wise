import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';
import { Typography, Spacing, BorderRadius, Shadows } from '@/lib/design';

interface StreakCounterProps {
  streak: number;
  label?: string;
}

export function StreakCounter({ streak, label = 'Day Streak' }: StreakCounterProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 107, 53, 0.15)', 'rgba(168, 85, 247, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <FontAwesome name="fire" size={24} color={Colors.primary} />
        <View style={styles.textContainer}>
          <Text style={styles.number}>{streak}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
  },
  background: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  number: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
