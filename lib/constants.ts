// App Colors - Vibrant fitness theme
export const Colors = {
  // Primary colors
  primary: '#FF6B35',        // Energetic Orange
  primaryDark: '#E55A2B',    // Darker orange for pressed states
  primaryLight: '#FF8A5C',   // Lighter orange for highlights

  // Secondary colors
  secondary: '#00D4FF',      // Electric Blue
  secondaryDark: '#00B8E0',
  secondaryLight: '#4DE5FF',

  // Accent colors
  accent: '#A855F7',         // Vivid Purple
  accentDark: '#9333EA',
  accentLight: '#C084FC',

  // Semantic colors
  success: '#84CC16',        // Lime Green
  successDark: '#65A30D',
  warning: '#FBBF24',        // Amber
  warningDark: '#F59E0B',
  error: '#EF4444',          // Red
  errorDark: '#DC2626',

  // Background colors
  background: '#0A0A0F',     // Near Black
  backgroundElevated: '#0F0F14',

  // Surface colors (cards, inputs)
  surface: '#141419',        // Card backgrounds
  surfaceLight: '#1A1A21',   // Elevated surfaces
  surfaceHover: '#222229',   // Hover states

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B7B',
  textInverse: '#0A0A0F',

  // Border colors
  border: '#2A2A35',
  borderLight: '#3A3A45',
  borderFocus: '#FF6B35',

  // Workout type colors (for badges/tags)
  workoutTypes: {
    AMRAP: '#FF6B35',
    'For Time': '#00D4FF',
    EMOM: '#A855F7',
    Chipper: '#84CC16',
    Intervals: '#FBBF24',
    Other: '#6B6B7B',
  } as { [key: string]: string },
};

// Movement categories and their movements
export const MOVEMENT_CATEGORIES = {
  gymnastics: {
    label: 'Gymnastics',
    movements: [
      'Pull-ups',
      'Chest-to-bar Pull-ups',
      'Muscle-ups (Bar)',
      'Muscle-ups (Ring)',
      'Handstand Push-ups',
      'Handstand Walk',
      'Toes-to-Bar',
      'Knees-to-Elbows',
      'Pistols',
      'Double-Unders',
      'Ring Dips',
      'Rope Climbs',
      'L-sits',
    ],
  },
  weightlifting: {
    label: 'Weightlifting',
    movements: [
      'Snatch',
      'Clean',
      'Clean & Jerk',
      'Power Snatch',
      'Power Clean',
      'Hang Snatch',
      'Hang Clean',
      'Overhead Squat',
      'Front Squat',
      'Back Squat',
      'Deadlift',
      'Sumo Deadlift High Pull',
      'Thruster',
      'Push Press',
      'Push Jerk',
      'Split Jerk',
      'Strict Press',
    ],
  },
  cardio: {
    label: 'Cardio',
    movements: [
      'Running',
      'Rowing',
      'Bike (Assault/Echo)',
      'Ski Erg',
      'Swimming',
      'Jump Rope (Singles)',
      'Box Jumps',
      'Burpees',
    ],
  },
  other: {
    label: 'Other',
    movements: [
      'Wall Balls',
      'Kettlebell Swings',
      'Turkish Get-ups',
      'Dumbbell Snatches',
      'Dumbbell Cleans',
      'Lunges',
      'Box Step-ups',
      'Farmers Carry',
      'Sandbag Carries',
      'Sled Push/Pull',
    ],
  },
} as const;

// Common lifts for 1RM tracking
export const TRACKED_LIFTS = [
  { name: 'Back Squat', key: 'backSquat' },
  { name: 'Front Squat', key: 'frontSquat' },
  { name: 'Deadlift', key: 'deadlift' },
  { name: 'Clean', key: 'clean' },
  { name: 'Clean & Jerk', key: 'cleanAndJerk' },
  { name: 'Snatch', key: 'snatch' },
  { name: 'Strict Press', key: 'strictPress' },
  { name: 'Push Press', key: 'pushPress' },
  { name: 'Push Jerk', key: 'pushJerk' },
  { name: 'Thruster', key: 'thruster' },
  { name: 'Bench Press', key: 'benchPress' },
] as const;

// Benchmark WODs
export const BENCHMARK_WODS = [
  { name: 'Fran', description: '21-15-9 Thrusters (95/65) & Pull-ups' },
  { name: 'Grace', description: '30 Clean & Jerks for time (135/95)' },
  { name: 'Murph', description: '1mi Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1mi Run' },
  { name: 'Helen', description: '3 RFT: 400m Run, 21 KB Swings, 12 Pull-ups' },
  { name: 'Diane', description: '21-15-9 Deadlifts (225/155) & HSPU' },
  { name: 'Isabel', description: '30 Snatches for time (135/95)' },
  { name: 'Jackie', description: '1000m Row, 50 Thrusters (45/35), 30 Pull-ups' },
  { name: 'Karen', description: '150 Wall Balls for time (20/14)' },
  { name: 'Cindy', description: 'AMRAP 20: 5 Pull-ups, 10 Push-ups, 15 Squats' },
  { name: 'Annie', description: '50-40-30-20-10 Double-Unders & Sit-ups' },
] as const;

// Free tier limits
export const FREE_TIER = {
  wodAnalysesPerMonth: 5,
  historyDays: 7,
};

// Skill level descriptions
export const SKILL_LEVELS = {
  1: { label: 'Cannot do', description: 'Unable to perform or needs significant modification' },
  2: { label: 'Learning', description: 'Can do with scaling/bands, working on technique' },
  3: { label: 'Developing', description: 'Can do unassisted but not efficiently in WODs' },
  4: { label: 'Proficient', description: 'Comfortable in WODs, good technique' },
  5: { label: 'Advanced', description: 'Can do high volume with excellent technique' },
} as const;

// Experience levels
export const EXPERIENCE_LEVELS = {
  beginner: { label: 'Beginner', description: '0-6 months of CrossFit' },
  intermediate: { label: 'Intermediate', description: '6 months - 2 years' },
  advanced: { label: 'Advanced', description: '2-5 years, solid all-around' },
  competitor: { label: 'Competitor', description: '5+ years or actively competing' },
} as const;
