import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Custom storage adapter for Supabase using SecureStore (iOS/Android) or localStorage (web)
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// Create a lazy-loaded client to avoid errors on import
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.');
    return null;
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return _supabase;
}

// Export a getter for the client
export const supabase = {
  get client() {
    return getSupabaseClient();
  }
};

// Helper functions for auth
export async function signUp(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: new Error('Supabase not configured. Add your credentials to .env') };
  }
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: new Error('Supabase not configured. Add your credentials to .env') };
  }
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }
  const { error } = await client.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, error: null };
  }
  const { data: { user }, error } = await client.auth.getUser();
  return { user, error };
}

export async function getSession() {
  const client = getSupabaseClient();
  if (!client) {
    return { session: null, error: null };
  }
  const { data: { session }, error } = await client.auth.getSession();
  return { session, error };
}

// Profile functions
interface ProfileData {
  experienceLevel: string;
  yearsExperience: number;
}

interface SkillData {
  movementName: string;
  skillLevel: number;
  category?: string;
}

interface StrengthData {
  liftName: string;
  weightLbs: number;
}

interface LimitationData {
  type: 'injury' | 'equipment' | 'other';
  description: string;
}

export async function saveProfile(data: ProfileData) {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  const { error } = await client
    .from('profiles')
    .upsert({
      id: user.id,
      experience_level: data.experienceLevel,
      crossfit_years: data.yearsExperience,
      updated_at: new Date().toISOString(),
    });

  return { error };
}

export async function saveMovementSkills(skills: SkillData[]) {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  // Delete existing skills first
  await client
    .from('movement_skills')
    .delete()
    .eq('user_id', user.id);

  if (skills.length === 0) {
    return { error: null };
  }

  const { error } = await client
    .from('movement_skills')
    .insert(
      skills.map((skill) => ({
        user_id: user.id,
        movement_name: skill.movementName,
        skill_level: skill.skillLevel,
        category: skill.category || null,
      }))
    );

  return { error };
}

export async function saveStrengthNumbers(lifts: StrengthData[]) {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  // Delete existing strength numbers first
  await client
    .from('strength_numbers')
    .delete()
    .eq('user_id', user.id);

  if (lifts.length === 0) {
    return { error: null };
  }

  const { error } = await client
    .from('strength_numbers')
    .insert(
      lifts.map((lift) => ({
        user_id: user.id,
        lift_name: lift.liftName,
        weight_lbs: lift.weightLbs,
      }))
    );

  return { error };
}

export async function saveLimitations(limitations: LimitationData[]) {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  // Delete existing limitations first
  await client
    .from('limitations')
    .delete()
    .eq('user_id', user.id);

  if (limitations.length === 0) {
    return { error: null };
  }

  const { error } = await client
    .from('limitations')
    .insert(
      limitations.map((lim) => ({
        user_id: user.id,
        limitation_type: lim.type,
        description: lim.description,
      }))
    );

  return { error };
}

// Load user profile for strategy generation
export interface UserProfile {
  experienceLevel: string | null;
  yearsExperience: number;
  skills: Record<string, number>;
  strengthNumbers: Record<string, number>;
  limitations: string[];
}

export async function loadUserProfile(): Promise<{ profile: UserProfile | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { profile: null, error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { profile: null, error: new Error('User not authenticated') };
  }

  try {
    // Load profile
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .select('experience_level, crossfit_years')
      .eq('id', user.id)
      .single();

    // Load skills
    const { data: skillsData, error: skillsError } = await client
      .from('movement_skills')
      .select('movement_name, skill_level')
      .eq('user_id', user.id);

    // Load strength numbers
    const { data: strengthData, error: strengthError } = await client
      .from('strength_numbers')
      .select('lift_name, weight_lbs')
      .eq('user_id', user.id);

    // Load limitations
    const { data: limitationsData, error: limitationsError } = await client
      .from('limitations')
      .select('limitation_type, description')
      .eq('user_id', user.id);

    // Convert to the format expected by the strategy generator
    const skills: Record<string, number> = {};
    if (skillsData) {
      skillsData.forEach((s: { movement_name: string; skill_level: number }) => {
        skills[s.movement_name] = s.skill_level;
      });
    }

    const strengthNumbers: Record<string, number> = {};
    if (strengthData) {
      strengthData.forEach((s: { lift_name: string; weight_lbs: number }) => {
        strengthNumbers[s.lift_name] = s.weight_lbs;
      });
    }

    const limitations: string[] = [];
    if (limitationsData) {
      limitationsData.forEach((l: { limitation_type: string; description: string }) => {
        limitations.push(`${l.limitation_type}: ${l.description}`);
      });
    }

    const profile: UserProfile = {
      experienceLevel: profileData?.experience_level || null,
      yearsExperience: profileData?.crossfit_years || 0,
      skills,
      strengthNumbers,
      limitations,
    };

    return { profile, error: null };
  } catch (err) {
    return { profile: null, error: err instanceof Error ? err : new Error('Failed to load profile') };
  }
}

// WOD History functions
import type { ParsedWorkout, WodStrategy } from './types';

interface WodHistoryEntry {
  parsedWorkout: ParsedWorkout;
  strategy: WodStrategy;
  imageUrl?: string;
  notes?: string;
}

export async function saveWodHistory(entry: WodHistoryEntry) {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  const { error } = await client
    .from('wod_history')
    .insert({
      user_id: user.id,
      parsed_workout: entry.parsedWorkout,
      strategy: entry.strategy,
      original_image_url: entry.imageUrl || null,
      notes: entry.notes || null,
    });

  return { error };
}

export async function loadWodHistory() {
  const client = getSupabaseClient();
  if (!client) {
    return { history: [], error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { history: [], error: new Error('User not authenticated') };
  }

  // Cleanup: delete entries older than 13 months
  const thirteenMonthsAgo = new Date();
  thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

  await client
    .from('wod_history')
    .delete()
    .eq('user_id', user.id)
    .lt('created_at', thirteenMonthsAgo.toISOString());

  const { data, error } = await client
    .from('wod_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { history: [], error };
  }

  const history = data.map((row: {
    id: string;
    parsed_workout: ParsedWorkout;
    strategy: WodStrategy;
    original_image_url: string | null;
    notes: string | null;
    created_at: string;
  }) => ({
    id: row.id,
    parsedWorkout: row.parsed_workout as ParsedWorkout,
    strategy: row.strategy as WodStrategy,
    imageUrl: row.original_image_url,
    notes: row.notes,
    createdAt: row.created_at,
  }));

  return { history, error: null };
}
