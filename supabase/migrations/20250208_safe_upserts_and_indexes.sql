-- Add unique constraints to enable safe upserts (prevents data loss from delete-then-insert pattern)

-- Movement skills: one rating per user per movement
ALTER TABLE movement_skills
  ADD CONSTRAINT IF NOT EXISTS movement_skills_user_movement_unique
  UNIQUE (user_id, movement_name);

-- Strength numbers: one record per user per lift
ALTER TABLE strength_numbers
  ADD CONSTRAINT IF NOT EXISTS strength_numbers_user_lift_unique
  UNIQUE (user_id, lift_name);

-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_movement_skills_user_id ON movement_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_numbers_user_id ON strength_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_limitations_user_id ON limitations(user_id);
CREATE INDEX IF NOT EXISTS idx_wod_history_user_created ON wod_history(user_id, created_at DESC);
