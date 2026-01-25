-- Add subscription_tier to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro'));

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, date);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own usage" ON api_usage;
DROP POLICY IF EXISTS "Service role can manage usage" ON api_usage;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Only the service role can insert/update (via Edge Function)
CREATE POLICY "Service role can manage usage" ON api_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Function to increment usage count (called by Edge Function)
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage (user_id, date, request_count, updated_at)
  VALUES (p_user_id, p_date, 1, NOW())
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    request_count = api_usage.request_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (but it runs as definer)
GRANT EXECUTE ON FUNCTION increment_api_usage(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_api_usage(UUID, DATE) TO service_role;
