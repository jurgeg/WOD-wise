# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WODwise is a React Native/Expo app for CrossFit athletes. Users photograph their gym's WOD (Workout of the Day), the app uses Claude Vision to parse it, then generates a personalized strategy based on the user's fitness profile.

## Development Commands

```bash
# Start development server
npm start

# Platform-specific
npm run ios
npm run android
npm run web

# Code quality
npm run lint          # Check for linting issues
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format all files with Prettier
npm run format:check  # Check formatting without modifying
npm run typecheck     # Run TypeScript type checker
```

## Architecture

### Frontend (React Native + Expo Router)

**Navigation Structure** (`app/`):
- `(tabs)/` - Main tab navigation (WOD input, History, Profile)
- `(auth)/` - Authentication screens (login, signup)
- `onboarding/` - 4-step profile wizard (experience → skills → strength → limitations)
- `wod/` - WOD confirmation and strategy display

**State Management**:
- Zustand store at `store/onboarding.ts` for wizard state
- Supabase handles persistent user data

### Backend (Supabase)

**Edge Function** (`supabase/functions/claude-proxy/`):
- Proxies Claude API requests (keeps API key server-side)
- Verifies JWT, enforces rate limits, tracks usage

**Database Tables**:
- `profiles` - User profile with `subscription_tier` ('free'|'pro')
- `movement_skills` - Per-movement skill ratings (1-5)
- `strength_numbers` - 1RM lift records
- `limitations` - Injuries/equipment constraints
- `wod_history` - Saved workouts with strategies
- `api_usage` - Daily request counts per user

### Key Libraries

- `lib/claude.ts` - Claude API client, auto-switches between Edge Function (production) and direct API (dev)
- `lib/supabase.ts` - Auth, profile CRUD, history management
- `lib/types.ts` - TypeScript types for workouts, strategies, profiles
- `lib/constants.ts` - Movement categories, tracked lifts, skill levels, colors

## AI Integration

Two Claude API actions:
1. **parse_wod** - Takes base64 image, returns structured `ParsedWorkout`
2. **generate_strategy** - Takes workout + user profile, returns `WodStrategy` with scaling, pacing, set breakdowns

The app prefers the Edge Function when `EXPO_PUBLIC_CLAUDE_API_KEY` is not set. For local dev, you can set the key directly in `.env`.

## Environment Variables

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-...  # Optional, only for local dev
```

## Supabase CLI Commands

```bash
# Deploy Edge Function
supabase functions deploy claude-proxy

# Set secrets
supabase secrets set CLAUDE_API_KEY=sk-ant-...

# View logs
supabase functions logs claude-proxy

# Run migration
supabase db push
```

## Rate Limits

- Free: 5 WOD analyses/day
- Pro: 100/day

Upgrade via SQL: `UPDATE profiles SET subscription_tier = 'pro' WHERE id = 'user-uuid';`

## Coding Conventions

### Imports
- Always use `@/` path aliases (e.g., `@/lib/constants`, `@/components/ui`)
- Group imports: React → React Native → Expo → Third-party → Local

### Error Handling
- Use `withRetry()` from `lib/retry.ts` for API calls
- Use `toast` from `components/ui/Toast` for user-facing notifications
- Use `Alert.alert()` only for blocking confirmations (e.g., save failures)
- Validate inputs via `lib/validation.ts` before DB writes

### Components
- UI primitives go in `components/ui/` with barrel export in `index.ts`
- Screen-specific components go in `components/<feature>/`
- All interactive elements must have `accessibilityRole` and `accessibilityLabel`
- Minimum touch target: 44x44pt (iOS HIG)

### State Management
- Zustand for client-side state (`store/`)
- Supabase for persistent server state (`lib/supabase.ts`)
- Use `store/workout.ts` to pass data between WOD flow screens (not URL params)

### Styling
- Use `Colors` from `lib/constants.ts` for all colors (no hardcoded hex values)
- Use `Spacing`, `BorderRadius`, `Typography` from `lib/design.ts`
- Prefer `StyleSheet.create()` over inline styles
