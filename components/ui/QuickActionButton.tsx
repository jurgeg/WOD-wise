import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';
import { Typography, Spacing, BorderRadius, Shadows } from '@/lib/design';

interface QuickActionButtonProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

export function QuickActionButton({
  icon,
  label,
  onPress,
  color = Colors.secondary,
  style,
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, style]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <FontAwesome name={icon} size={22} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
  },
});
