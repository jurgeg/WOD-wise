import { create } from 'zustand';
import type { ExperienceLevel } from '@/lib/types';

interface Limitation {
  id: string;
  type: 'injury' | 'equipment' | 'other';
  description: string;
}

interface OnboardingState {
  // Experience
  experienceLevel: ExperienceLevel | null;
  yearsExperience: number;

  // Skills
  skills: Record<string, number>;

  // Strength (1RMs)
  lifts: Record<string, number>;

  // Limitations
  limitations: Limitation[];

  // Actions
  setExperience: (level: ExperienceLevel, years: number) => void;
  setSkills: (skills: Record<string, number>) => void;
  setLifts: (lifts: Record<string, number>) => void;
  setLimitations: (limitations: Limitation[]) => void;
  reset: () => void;
}

const initialState = {
  experienceLevel: null,
  yearsExperience: 1,
  skills: {},
  lifts: {},
  limitations: [],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setExperience: (level, years) => set({
    experienceLevel: level,
    yearsExperience: years
  }),

  setSkills: (skills) => set({ skills }),

  setLifts: (lifts) => set({ lifts }),

  setLimitations: (limitations) => set({ limitations }),

  reset: () => set(initialState),
}));
