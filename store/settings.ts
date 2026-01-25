import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeightUnit = 'lbs' | 'kg';

interface SettingsState {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  toggleWeightUnit: () => void;
}

// Conversion helpers
export const lbsToKg = (lbs: number): number => Math.round(lbs * 0.453592);
export const kgToLbs = (kg: number): number => Math.round(kg * 2.20462);

export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return value;
  return from === 'lbs' ? lbsToKg(value) : kgToLbs(value);
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weightUnit: 'lbs',

      setWeightUnit: (unit) => set({ weightUnit: unit }),

      toggleWeightUnit: () =>
        set((state) => ({
          weightUnit: state.weightUnit === 'lbs' ? 'kg' : 'lbs',
        })),
    }),
    {
      name: 'wodwise-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
