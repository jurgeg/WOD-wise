// User Profile Types
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'competitor';

export type MovementCategory = 'gymnastics' | 'weightlifting' | 'cardio' | 'other';

export interface UserProfile {
  id: string;
  email: string;
  experienceLevel: ExperienceLevel;
  crossfitYears: number;
  goals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MovementSkill {
  id: string;
  userId: string;
  movementName: string;
  category: MovementCategory;
  skillLevel: 1 | 2 | 3 | 4 | 5;
  canPerform: boolean;
  notes?: string;
}

export interface StrengthNumber {
  id: string;
  userId: string;
  liftName: string;
  weightLbs: number;
  recordedAt: string;
}

export interface Limitation {
  id: string;
  userId: string;
  limitationType: 'injury' | 'equipment' | 'time';
  description: string;
  affectedMovements: string[];
}

// WOD Types
export type WorkoutType = 'AMRAP' | 'For Time' | 'EMOM' | 'Chipper' | 'Intervals' | 'Other';

export interface WodMovement {
  name: string;
  reps: number | 'max';
  weightRx?: {
    male: number;
    female: number;
  };
  equipment?: string;
  notes?: string;
}

export interface ParsedWorkout {
  workoutType: WorkoutType;
  timeCap?: number;
  rounds?: number;
  movements: WodMovement[];
  notes?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface WodStrategy {
  scaling?: {
    movement: string;
    original: string;
    scaled: string;
    reason: string;
  }[];
  pacing: string;
  setBreakdowns: {
    movement: string;
    strategy: string;
  }[];
  estimatedTime: {
    min: number;
    max: number;
  };
  tips: string[];
  cautions?: string[];
  substitutions?: {
    movement: string;
    options: {
      name: string;
      reason: string;
    }[];
  }[];
}

export interface WodHistory {
  id: string;
  userId: string;
  originalImageUrl?: string;
  parsedWorkout: ParsedWorkout;
  strategy: WodStrategy;
  actualTime?: number;
  notes?: string;
  createdAt: string;
}

// Auth Types
export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
