import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Rate limits
const FREE_TIER_DAILY_LIMIT = 5;
const PRO_TIER_DAILY_LIMIT = 100;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClaudeRequest {
  action: "parse_wod" | "generate_strategy";
  imageBase64?: string;
  mimeType?: string;
  workout?: unknown;
  userProfile?: unknown;
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split("T")[0];

  // Get user's subscription tier (default to free)
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  const tier = profile?.subscription_tier || "free";
  const dailyLimit = tier === "pro" ? PRO_TIER_DAILY_LIMIT : FREE_TIER_DAILY_LIMIT;

  // Get today's usage count
  const { data: usage, error } = await supabase
    .from("api_usage")
    .select("request_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const currentCount = usage?.request_count || 0;
  const remaining = Math.max(0, dailyLimit - currentCount);

  return {
    allowed: currentCount < dailyLimit,
    remaining,
  };
}

async function incrementUsage(supabase: ReturnType<typeof createClient>, userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Upsert usage record
  await supabase.rpc("increment_api_usage", {
    p_user_id: userId,
    p_date: today,
  });
}

async function callClaude(messages: unknown[], systemPrompt: string): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error("Claude API key not configured on server");
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
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

async function parseWodImage(imageBase64: string, mimeType: string): Promise<unknown> {
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
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType,
            data: imageBase64,
          },
        },
      ],
    },
  ];

  const response = await callClaude(messages, systemPrompt);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }
  return JSON.parse(jsonMatch[0]);
}

async function generateStrategy(workout: unknown, userProfile: unknown): Promise<unknown> {
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

  const profile = userProfile as Record<string, unknown> || {};
  const userMessage = `
WORKOUT:
${JSON.stringify(workout, null, 2)}

USER PROFILE:
- Experience Level: ${profile.experienceLevel || "Not specified"}
- Skills: ${profile.skills ? JSON.stringify(profile.skills) : "Not specified"}
- Strength Numbers (1RM in lbs): ${profile.strengthNumbers ? JSON.stringify(profile.strengthNumbers) : "Not specified"}
- Limitations/Injuries: ${Array.isArray(profile.limitations) && profile.limitations.length ? profile.limitations.join(", ") : "None specified"}

Provide a personalized strategy for this workout based on the user's profile. Consider their skill levels and any limitations when suggesting scaling or substitutions.`;

  const messages = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await callClaude(messages, systemPrompt);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }
  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(supabaseAdmin, user.id);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Daily limit reached",
          message: "You've used all your daily WOD analyses. Upgrade to Pro for more!",
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: ClaudeRequest = await req.json();

    let result: unknown;

    if (body.action === "parse_wod") {
      if (!body.imageBase64) {
        throw new Error("Missing imageBase64");
      }
      result = await parseWodImage(body.imageBase64, body.mimeType || "image/png");
    } else if (body.action === "generate_strategy") {
      if (!body.workout) {
        throw new Error("Missing workout data");
      }
      result = await generateStrategy(body.workout, body.userProfile);
    } else {
      throw new Error("Invalid action");
    }

    // Increment usage after successful API call
    await incrementUsage(supabaseAdmin, user.id);

    return new Response(
      JSON.stringify({ data: result, remaining: remaining - 1 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
