import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUserProfile } from '@/lib/supabase';
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

  // Hydration tracking (not persisted)
  _profileLoaded: boolean;

  // Actions
  setExperience: (level: ExperienceLevel, years: number) => void;
  setSkills: (skills: Record<string, number>) => void;
  setLifts: (lifts: Record<string, number>) => void;
  setLimitations: (limitations: Limitation[]) => void;
  hydrateFromSupabase: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  experienceLevel: null as ExperienceLevel | null,
  yearsExperience: 1,
  skills: {} as Record<string, number>,
  lifts: {} as Record<string, number>,
  limitations: [] as Limitation[],
  _profileLoaded: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setExperience: (level, years) => set({
        experienceLevel: level,
        yearsExperience: years,
      }),

      setSkills: (skills) => set({ skills }),

      setLifts: (lifts) => set({ lifts }),

      setLimitations: (limitations) => set({ limitations }),

      hydrateFromSupabase: async () => {
        const { profile, error } = await loadUserProfile();
        if (error || !profile) return;

        const limitations: Limitation[] = (profile.limitations || []).map(
          (limStr, index) => {
            const colonIndex = limStr.indexOf(':');
            if (colonIndex > -1) {
              const type = limStr.substring(0, colonIndex).trim() as Limitation['type'];
              const description = limStr.substring(colonIndex + 1).trim();
              return { id: `lim-${index}`, type, description };
            }
            return { id: `lim-${index}`, type: 'other' as const, description: limStr };
          }
        );

        set({
          experienceLevel: (profile.experienceLevel as ExperienceLevel) || null,
          yearsExperience: profile.yearsExperience || 1,
          skills: profile.skills || {},
          lifts: profile.strengthNumbers || {},
          limitations,
          _profileLoaded: true,
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'wodwise-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        experienceLevel: state.experienceLevel,
        yearsExperience: state.yearsExperience,
        skills: state.skills,
        lifts: state.lifts,
        limitations: state.limitations,
      }),
    }
  )
);
