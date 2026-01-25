import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/lib/constants';
import { BorderRadius, Spacing, Shadows } from '@/lib/design';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient-border';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}: CardProps) {
  const paddingValue = {
    none: 0,
    small: Spacing.sm,
    medium: Spacing.lg,
    large: Spacing.xl,
  }[padding];

  if (variant === 'gradient-border') {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBorderOuter, style]}
      >
        <View style={[styles.gradientBorderInner, { padding: paddingValue }]}>
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  elevated: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.borderLight,
    ...Shadows.elevated,
  },
  gradientBorderOuter: {
    borderRadius: BorderRadius.lg + 1,
    padding: 1.5,
    ...Shadows.elevated,
  },
  gradientBorderInner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg - 0.5,
  },
});
