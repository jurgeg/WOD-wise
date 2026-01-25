import { TextStyle, ViewStyle } from 'react-native';
import { Colors } from './constants';

// Typography scale
export const Typography = {
  // Display (for branding, hero text)
  displayLarge: {
    fontSize: 40,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 48,
  },
  displayMedium: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },

  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Body text
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Labels and captions
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },

  // Numbers (for stats, timers)
  numberLarge: {
    fontSize: 48,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 56,
  },
  numberMedium: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
};

// Spacing scale (4px base)
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

// Border radius
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow definitions
export const Shadows = {
  // Subtle shadow for cards
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  // Medium shadow for elevated elements
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  // Glow effect for primary buttons
  primaryGlow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  // Glow effect for secondary elements
  secondaryGlow: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  // Accent glow
  accentGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Animation durations
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Gradient configurations
export const Gradients = {
  primary: {
    colors: ['#FF6B35', '#FF8A5C'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  primaryHorizontal: {
    colors: ['#FF6B35', '#E55A2B'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  secondary: {
    colors: ['#00D4FF', '#00B8E0'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  accent: {
    colors: ['#A855F7', '#9333EA'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  brand: {
    colors: ['#FF6B35', '#A855F7'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  brandVertical: {
    colors: ['#FF6B35', '#00D4FF', '#A855F7'] as readonly string[],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  success: {
    colors: ['#84CC16', '#65A30D'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Common style mixins
export const Mixins = {
  // Card base style
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  } as ViewStyle,

  // Elevated card (more prominent)
  cardElevated: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.elevated,
  } as ViewStyle,

  // Primary button base
  buttonPrimary: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    ...Shadows.primaryGlow,
  } as ViewStyle,

  // Secondary button
  buttonSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  } as ViewStyle,

  // Input field
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.text,
    fontSize: 15,
  } as ViewStyle,

  // Section title
  sectionTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  } as TextStyle,

  // Center content
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  // Full width
  fullWidth: {
    width: '100%',
  } as ViewStyle,
};
