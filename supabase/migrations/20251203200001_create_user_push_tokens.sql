-- User Push Tokens Table
-- Stores Expo Push Tokens for push notification delivery
-- Reference: Session 9 - Weekly Synthesis Part 2

CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate tokens per user
  CONSTRAINT unique_user_token UNIQUE (user_id, expo_push_token)
);

-- Performance indexes
CREATE INDEX idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_active ON user_push_tokens(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own tokens
CREATE POLICY select_own_tokens ON user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_tokens ON user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_tokens ON user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_tokens ON user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can read all tokens (for push delivery)
CREATE POLICY service_select_tokens ON user_push_tokens
  FOR SELECT USING (true);

COMMENT ON TABLE user_push_tokens IS 'Expo Push Tokens for mobile push notifications';
COMMENT ON COLUMN user_push_tokens.expo_push_token IS 'Format: ExponentPushToken[xxx]';
