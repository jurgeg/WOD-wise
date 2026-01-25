import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/lib/constants';
import { Typography, Spacing, BorderRadius, Gradients } from '@/lib/design';

interface WeeklyProgressTrackerProps {
  completedDays: number[]; // Array of day indices (0 = Monday, 6 = Sunday)
  currentDay?: number;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeeklyProgressTracker({
  completedDays = [],
  currentDay,
}: WeeklyProgressTrackerProps) {
  // Calculate current day if not provided (0 = Monday, 6 = Sunday)
  const today = currentDay ?? ((new Date().getDay() + 6) % 7);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>This Week</Text>
      <View style={styles.daysContainer}>
        {DAYS.map((day, index) => {
          const isCompleted = completedDays.includes(index);
          const isCurrent = index === today;

          return (
            <View key={index} style={styles.dayWrapper}>
              {isCompleted ? (
                <LinearGradient
                  colors={[...Gradients.primary.colors]}
                  style={[styles.dayDot, styles.dayDotCompleted]}
                >
                  <Text style={styles.dayTextCompleted}>{day}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.dayDot,
                    isCurrent && styles.dayDotCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isCurrent && styles.dayTextCurrent,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayWrapper: {
    alignItems: 'center',
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotCompleted: {
    borderWidth: 0,
  },
  dayDotCurrent: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  dayTextCompleted: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
  },
  dayTextCurrent: {
    color: Colors.primary,
  },
});
