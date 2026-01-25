# Supabase Setup for WODwise

This directory contains Supabase Edge Functions and database migrations for the WODwise app.

## Overview

The app uses a Supabase Edge Function (`claude-proxy`) to securely proxy requests to the Claude API. This keeps your API key on the server and enables:

- **API Key Security**: Your Claude API key is never exposed in the app bundle
- **Rate Limiting**: Free tier users get 5 WOD analyses/day, Pro users get 100/day
- **Usage Tracking**: All API usage is tracked per user per day
- **Authentication**: Only authenticated users can make API requests

## Setup Instructions

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### 2. Link to Your Project

```bash
cd wodwise
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### 3. Run Database Migration

Apply the migration to add the `api_usage` table and `subscription_tier` column:

```bash
supabase db push
```

Or run manually in the Supabase SQL Editor:
- Open `migrations/20250120_add_api_usage.sql`
- Copy and paste into the SQL Editor
- Run the query

### 4. Set Edge Function Secrets

Store your Claude API key as a secret (never commit this!):

```bash
supabase secrets set CLAUDE_API_KEY=sk-ant-your-actual-key-here
```

### 5. Deploy the Edge Function

```bash
supabase functions deploy claude-proxy
```

### 6. Update Your App's .env

For **production** builds (TestFlight/App Store), remove the `EXPO_PUBLIC_CLAUDE_API_KEY`:

```bash
# .env.production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# DO NOT include EXPO_PUBLIC_CLAUDE_API_KEY in production!
```

For **development** (local testing), you can keep using the direct API key:

```bash
# .env.local (development only)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-your-key  # Optional: for local dev without Edge Function
```

## How It Works

### Request Flow

1. User taps "Analyze WOD" in the app
2. App calls `parseWodImage()` which sends request to Edge Function
3. Edge Function:
   - Verifies user's JWT token
   - Checks daily usage limit
   - Calls Claude API with server-side API key
   - Increments usage counter
   - Returns result to app
4. App displays the parsed workout

### Rate Limits

| Tier | Daily Limit |
|------|-------------|
| Free | 5 analyses |
| Pro  | 100 analyses |

To upgrade a user to Pro, update their profile:

```sql
UPDATE profiles SET subscription_tier = 'pro' WHERE id = 'user-uuid';
```

### Database Tables

**api_usage**
- `user_id`: UUID of the user
- `date`: Date of usage
- `request_count`: Number of API calls that day

**profiles** (updated)
- Added `subscription_tier`: 'free' or 'pro'

## Testing Locally

You can test the Edge Function locally:

```bash
supabase functions serve claude-proxy --env-file .env.local
```

Then the function will be available at:
`http://localhost:54321/functions/v1/claude-proxy`

## Monitoring

View Edge Function logs in the Supabase dashboard:
1. Go to Edge Functions
2. Select `claude-proxy`
3. Click "Logs"

Or via CLI:
```bash
supabase functions logs claude-proxy
```

## Cost Management

Set a spending limit on your Anthropic account:
1. Go to https://console.anthropic.com
2. Settings → Billing → Set monthly limit

This prevents runaway costs even if someone finds a vulnerability.
