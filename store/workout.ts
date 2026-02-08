import { create } from 'zustand';
import type { ParsedWorkout, WodStrategy } from '@/lib/types';

/**
 * Transient store for the current WOD analysis flow.
 * Used to pass large objects between screens without URL params.
 */
interface WorkoutFlowState {
  /** The image URI selected for analysis */
  imageUri: string | null;
  /** The base64-encoded image data */
  imageBase64: string | null;
  /** The MIME type of the image */
  imageMimeType: string | null;
  /** The parsed workout from Claude Vision */
  parsedWorkout: ParsedWorkout | null;
  /** The generated strategy */
  strategy: WodStrategy | null;
  /** Any user-specified injury for this session */
  injury: string | null;

  setImage: (uri: string, base64: string, mimeType: string) => void;
  setParsedWorkout: (workout: ParsedWorkout) => void;
  setStrategy: (strategy: WodStrategy) => void;
  setInjury: (injury: string | null) => void;
  clear: () => void;
}

export const useWorkoutFlowStore = create<WorkoutFlowState>((set) => ({
  imageUri: null,
  imageBase64: null,
  imageMimeType: null,
  parsedWorkout: null,
  strategy: null,
  injury: null,

  setImage: (uri, base64, mimeType) =>
    set({ imageUri: uri, imageBase64: base64, imageMimeType: mimeType }),

  setParsedWorkout: (workout) => set({ parsedWorkout: workout }),

  setStrategy: (strategy) => set({ strategy }),

  setInjury: (injury) => set({ injury }),

  clear: () =>
    set({
      imageUri: null,
      imageBase64: null,
      imageMimeType: null,
      parsedWorkout: null,
      strategy: null,
      injury: null,
    }),
}));
