/**
 * Validated environment variables.
 *
 * IMPORTANT: Expo/Metro only inlines STATIC references to process.env.
 * e.g. process.env.EXPO_PUBLIC_FOO works, but process.env[key] does NOT.
 * All env var access must be written as literal dot-notation.
 */

/** Whether the app is running in Expo development mode. */
export const isDev = __DEV__;

// Static references — Metro replaces these at build time
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const CLAUDE_API_KEY_RAW = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

export const env = {
  /** Supabase project URL. */
  supabaseUrl: SUPABASE_URL,

  /** Supabase anonymous key. */
  supabaseAnonKey: SUPABASE_ANON_KEY,

  /**
   * Claude API key for direct API calls (dev only).
   * In production builds, this is blocked — all AI calls
   * go through the Edge Function which holds the key server-side.
   */
  claudeApiKey: (() => {
    if (!CLAUDE_API_KEY_RAW) return undefined;
    if (!isDev) {
      console.warn(
        'EXPO_PUBLIC_CLAUDE_API_KEY is set in a production build. ' +
        'This is a security risk — the API key is embedded in the client bundle. ' +
        'Remove it and use the Edge Function instead.'
      );
      return undefined;
    }
    return CLAUDE_API_KEY_RAW;
  })(),
} as const;
