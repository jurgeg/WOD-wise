import type { ParsedWorkout, WodStrategy } from './types';
import { getSession } from './supabase';

// Edge Function URL - your Supabase project URL + function name
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/claude-proxy`;

// For backward compatibility during development - can still use direct API
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
const USE_EDGE_FUNCTION = !CLAUDE_API_KEY; // Prefer Edge Function when no local key

export const isClaudeConfigured = Boolean(SUPABASE_URL);

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  remaining?: number;
}

interface UserProfile {
  experienceLevel?: string;
  skills?: Record<string, number>;
  strengthNumbers?: Record<string, number>;
  limitations?: string[];
}

// Call the Edge Function (secure - API key on server)
async function callEdgeFunction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { session } = await getSession();

  if (!session) {
    throw new Error('You must be signed in to analyze workouts');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

  const result: ApiResponse<T> = await response.json();

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(result.message || 'Daily limit reached. Upgrade to Pro for more analyses!');
    }
    throw new Error(result.error || 'API request failed');
  }

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data as T;
}

// Direct Claude API call (only for development when CLAUDE_API_KEY is set)
async function callClaudeDirect(messages: unknown[], systemPrompt: string): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function parseWodImage(imageBase64: string, mimeType: string = 'image/png'): Promise<ParsedWorkout> {
  // Use Edge Function (secure)
  if (USE_EDGE_FUNCTION) {
    return callEdgeFunction<ParsedWorkout>('parse_wod', {
      imageBase64,
      mimeType,
    });
  }

  // Development fallback: direct API call
  const systemPrompt = `You are a CrossFit workout parser. Analyze workout images and extract structured data.

Always respond with valid JSON only, no other text. Use this exact format:
{
  "workoutType": "AMRAP" | "For Time" | "EMOM" | "Chipper" | "Intervals" | "Other",
  "timeCap": number or null,
  "rounds": number or null,
  "movements": [
    {
      "name": "string",
      "reps": number,
      "weightRx": { "male": number, "female": number } or null,
      "equipment": "string" or null,
      "notes": "string" or null
    }
  ],
  "notes": "string" or null,
  "confidence": "high" | "medium" | "low"
}`;

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: imageBase64,
          },
        },
      ],
    },
  ];

  const response = await callClaudeDirect(messages, systemPrompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as ParsedWorkout;
  } catch (e) {
    console.error('Failed to parse Claude response:', response);
    throw new Error('Failed to parse workout from image');
  }
}

export async function generateStrategy(
  workout: ParsedWorkout,
  userProfile: UserProfile
): Promise<WodStrategy> {
  // Use Edge Function (secure)
  if (USE_EDGE_FUNCTION) {
    return callEdgeFunction<WodStrategy>('generate_strategy', {
      workout,
      userProfile,
    });
  }

  // Development fallback: direct API call
  const systemPrompt = `You are an expert CrossFit coach providing personalized workout strategies.

Always respond with valid JSON only, no other text. Use this exact format:
{
  "scaling": [
    {
      "movement": "string",
      "original": "string",
      "scaled": "string",
      "reason": "string"
    }
  ] or null,
  "pacing": "string",
  "setBreakdowns": [
    {
      "movement": "string",
      "strategy": "string"
    }
  ],
  "estimatedTime": {
    "min": number,
    "max": number
  },
  "tips": ["string"],
  "cautions": ["string"] or null,
  "substitutions": [
    {
      "movement": "string",
      "options": [
        { "name": "string", "reason": "string" }
      ]
    }
  ] or null
}`;

  const userMessage = `
WORKOUT:
${JSON.stringify(workout, null, 2)}

USER PROFILE:
- Experience Level: ${userProfile.experienceLevel || 'Not specified'}
- Skills: ${userProfile.skills ? JSON.stringify(userProfile.skills) : 'Not specified'}
- Strength Numbers (1RM in lbs): ${userProfile.strengthNumbers ? JSON.stringify(userProfile.strengthNumbers) : 'Not specified'}
- Limitations/Injuries: ${userProfile.limitations?.length ? userProfile.limitations.join(', ') : 'None specified'}

Provide a personalized strategy for this workout based on the user's profile. Consider their skill levels and any limitations when suggesting scaling or substitutions.`;

  const messages = [
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const response = await callClaudeDirect(messages, systemPrompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as WodStrategy;
  } catch (e) {
    console.error('Failed to parse Claude response:', response);
    throw new Error('Failed to generate strategy');
  }
}

// Export function to check remaining usage
export async function getRemainingUsage(): Promise<number | null> {
  try {
    const { session } = await getSession();
    if (!session) return null;

    // This would call an edge function to get usage, but for now return null
    // to indicate we don't know the remaining count
    return null;
  } catch {
    return null;
  }
}
