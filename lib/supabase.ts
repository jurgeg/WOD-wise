import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { validateExperienceLevel, validateYearsExperience, validateMovementSkills, validateStrengthNumbers, validateLimitations, ValidationError } from './validation';
import { env } from './env';

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

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
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

export async function resetPasswordForEmail(email: string) {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }
  const { error } = await client.auth.resetPasswordForEmail(email);
  return { error };
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

  try {
    const level = validateExperienceLevel(data.experienceLevel);
    const years = validateYearsExperience(data.yearsExperience);

    const { error } = await client
      .from('profiles')
      .upsert({
        id: user.id,
        experience_level: level,
        crossfit_years: years,
        updated_at: new Date().toISOString(),
      });

    return { error };
  } catch (err) {
    if (err instanceof ValidationError) {
      return { error: err };
    }
    throw err;
  }
}

export async function saveMovementSkills(skills: SkillData[]) {
  // Validate input before touching the database
  try {
    if (skills.length > 0) {
      validateMovementSkills(skills);
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      return { error: err };
    }
    throw err;
  }

  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  // If clearing all skills, just delete
  if (skills.length === 0) {
    const { error } = await client
      .from('movement_skills')
      .delete()
      .eq('user_id', user.id);
    return { error };
  }

  // Upsert all skills (safe — no data loss if this fails partway)
  const { error: upsertError } = await client
    .from('movement_skills')
    .upsert(
      skills.map((skill) => ({
        user_id: user.id,
        movement_name: skill.movementName,
        skill_level: skill.skillLevel,
        category: skill.category || null,
      })),
      { onConflict: 'user_id,movement_name' }
    );

  if (upsertError) {
    return { error: upsertError };
  }

  // Clean up movements that were removed (only AFTER successful upsert)
  const movementNames = skills.map((s) => s.movementName);
  const { error: cleanupError } = await client
    .from('movement_skills')
    .delete()
    .eq('user_id', user.id)
    .not('movement_name', 'in', `(${movementNames.map((n) => `"${n}"`).join(',')})`);

  return { error: cleanupError };
}

export async function saveStrengthNumbers(lifts: StrengthData[]) {
  // Validate input before touching the database
  try {
    if (lifts.length > 0) {
      validateStrengthNumbers(lifts);
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      return { error: err };
    }
    throw err;
  }

  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  // If clearing all lifts, just delete
  if (lifts.length === 0) {
    const { error } = await client
      .from('strength_numbers')
      .delete()
      .eq('user_id', user.id);
    return { error };
  }

  // Upsert all lifts (safe — no data loss if this fails partway)
  const { error: upsertError } = await client
    .from('strength_numbers')
    .upsert(
      lifts.map((lift) => ({
        user_id: user.id,
        lift_name: lift.liftName,
        weight_lbs: lift.weightLbs,
      })),
      { onConflict: 'user_id,lift_name' }
    );

  if (upsertError) {
    return { error: upsertError };
  }

  // Clean up lifts that were removed (only AFTER successful upsert)
  const liftNames = lifts.map((l) => l.liftName);
  const { error: cleanupError } = await client
    .from('strength_numbers')
    .delete()
    .eq('user_id', user.id)
    .not('lift_name', 'in', `(${liftNames.map((n) => `"${n}"`).join(',')})`);

  return { error: cleanupError };
}

export async function saveLimitations(limitations: LimitationData[]) {
  // Validate input before touching the database
  try {
    if (limitations.length > 0) {
      validateLimitations(limitations);
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      return { error: err };
    }
    throw err;
  }

  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  // Limitations don't have a natural unique key (user could have multiple injuries),
  // so we use a transaction-safe approach: insert new ones first, then delete old ones.
  if (limitations.length === 0) {
    const { error } = await client
      .from('limitations')
      .delete()
      .eq('user_id', user.id);
    return { error };
  }

  // Insert new limitations
  const newRows = limitations.map((lim) => ({
    user_id: user.id,
    limitation_type: lim.type,
    description: lim.description,
  }));

  const { data: inserted, error: insertError } = await client
    .from('limitations')
    .insert(newRows)
    .select('id');

  if (insertError) {
    return { error: insertError };
  }

  // Delete old limitations (only AFTER successful insert of new ones)
  const newIds = (inserted || []).map((row: { id: string }) => row.id);
  if (newIds.length > 0) {
    const { error: cleanupError } = await client
      .from('limitations')
      .delete()
      .eq('user_id', user.id)
      .not('id', 'in', `(${newIds.join(',')})`);

    return { error: cleanupError };
  }

  return { error: null };
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

// --- User Stats ---

// Get user workout stats (streak + weekly completed days)
export async function getUserWorkoutStats(): Promise<{
  streak: number;
  completedDays: number[];
  error: Error | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { streak: 0, completedDays: [], error: null };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { streak: 0, completedDays: [], error: null };
  }

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data, error } = await client
      .from('wod_history')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error || !data) {
      return { streak: 0, completedDays: [], error };
    }

    // Unique dates with workouts
    const workoutDates = new Set(
      data.map((row: { created_at: string }) =>
        new Date(row.created_at).toISOString().split('T')[0]
      )
    );

    // Streak: consecutive days going backwards from today
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (workoutDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break; // Allow today to not have a workout yet
      }
    }

    // Completed days this week (0=Mon ... 6=Sun)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const completedDays: number[] = [];
    workoutDates.forEach((dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      if (date >= monday) {
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        if (!completedDays.includes(dayIndex)) {
          completedDays.push(dayIndex);
        }
      }
    });

    return { streak, completedDays: completedDays.sort(), error: null };
  } catch (err) {
    return { streak: 0, completedDays: [], error: err instanceof Error ? err : new Error('Failed to load stats') };
  }
}

// Get API usage for today
export async function getApiUsageToday(): Promise<{
  used: number;
  limit: number;
  tier: string;
  error: Error | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { used: 0, limit: 5, tier: 'free', error: null };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { used: 0, limit: 5, tier: 'free', error: null };
  }

  try {
    const { data: profile } = await client
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    const limit = tier === 'pro' ? 100 : 5;

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await client
      .from('api_usage')
      .select('request_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const used = usage?.request_count || 0;
    return { used, limit, tier, error: null };
  } catch (err) {
    return { used: 0, limit: 5, tier: 'free', error: err instanceof Error ? err : new Error('Failed to load usage') };
  }
}

// --- WOD History ---
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

export async function loadWodHistory(options: { limit?: number; offset?: number } = {}) {
  const client = getSupabaseClient();
  if (!client) {
    return { history: [], hasMore: false, error: new Error('Supabase not configured') };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { history: [], hasMore: false, error: new Error('User not authenticated') };
  }

  const pageLimit = options.limit || 20;
  const offset = options.offset || 0;

  const { data, error } = await client
    .from('wod_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageLimit - 1);

  if (error) {
    return { history: [], hasMore: false, error };
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

  return { history, hasMore: data.length === pageLimit, error: null };
}
