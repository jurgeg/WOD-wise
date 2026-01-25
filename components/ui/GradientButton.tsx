import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/lib/constants';
import { Typography, BorderRadius, Spacing, Shadows, Gradients } from '@/lib/design';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function GradientButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  fullWidth = false,
}: GradientButtonProps) {
  const gradientConfig = {
    primary: Gradients.primary,
    secondary: Gradients.secondary,
    accent: Gradients.accent,
  }[variant];

  const shadowStyle = {
    primary: Shadows.primaryGlow,
    secondary: Shadows.secondaryGlow,
    accent: Shadows.accentGlow,
  }[variant];

  const sizeStyles = {
    small: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    medium: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
    large: { paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xxl },
  }[size];

  const textSize = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        !disabled && shadowStyle,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? [Colors.surfaceLight, Colors.surface] : [...gradientConfig.colors]}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={[styles.gradient, sizeStyles]}
      >
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text style={[styles.text, textSize, disabled && styles.textDisabled]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  iconWrapper: {
    marginRight: Spacing.xs,
  },
  text: {
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
});
