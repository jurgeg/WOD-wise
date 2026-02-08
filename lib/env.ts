/**
 * Validated environment variables.
 * Throws at import time if required variables are missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

/** Whether the app is running in Expo development mode. */
export const isDev = __DEV__;

export const env = {
  /** Supabase project URL (required). */
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),

  /** Supabase anonymous key (required). */
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  /**
   * Claude API key for direct API calls (dev only).
   * In production builds, this should NOT be set - all AI calls
   * go through the Edge Function which holds the key server-side.
   */
  claudeApiKey: (() => {
    const key = optionalEnv('EXPO_PUBLIC_CLAUDE_API_KEY');
    if (key && !isDev) {
      console.warn(
        'EXPO_PUBLIC_CLAUDE_API_KEY is set in a production build. ' +
        'This is a security risk — the API key is embedded in the client bundle. ' +
        'Remove it and use the Edge Function instead.'
      );
      return undefined; // Block the key in production
    }
    return key;
  })(),
} as const;
