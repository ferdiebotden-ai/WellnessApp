-- Nudge Delivery & Push Notification Logging Tables
-- Tracks suppression decisions and push notification delivery for beta instrumentation
-- Reference: Session 72 - OPUS45 Brief Gap #3 and #4

-- ============================================================================
-- Table 1: nudge_delivery_log
-- Tracks every nudge suppression decision for debugging and analytics
-- ============================================================================

CREATE TABLE nudge_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification (uses firebase_uid for consistency)
  firebase_uid TEXT NOT NULL,

  -- Nudge details
  nudge_id TEXT,
  nudge_type TEXT, -- 'protocol', 'reminder', 'mvd', 'synthesis', etc.
  nudge_priority TEXT CHECK (nudge_priority IN ('CRITICAL', 'ADAPTIVE', 'STANDARD')),
  protocol_id TEXT, -- If nudge is for a specific protocol

  -- Suppression result
  should_deliver BOOLEAN NOT NULL,
  suppressed_by TEXT, -- Rule ID that suppressed (e.g., 'quiet_hours', 'daily_cap')
  suppression_reason TEXT, -- Human-readable reason
  rules_checked TEXT[], -- Array of all rule IDs that were evaluated
  was_overridden BOOLEAN DEFAULT false,
  overridden_rule TEXT, -- Which rule was overridden (if any)

  -- Context snapshot (for debugging why suppression happened)
  context_snapshot JSONB DEFAULT '{}', -- Stores SuppressionContext at time of decision
  -- Example: { "nudgesDeliveredToday": 3, "userLocalHour": 14, "recoveryScore": 65 }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_nudge_delivery_log_firebase_uid ON nudge_delivery_log(firebase_uid);
CREATE INDEX idx_nudge_delivery_log_created_at ON nudge_delivery_log(created_at);
CREATE INDEX idx_nudge_delivery_log_should_deliver ON nudge_delivery_log(should_deliver);
CREATE INDEX idx_nudge_delivery_log_suppressed_by ON nudge_delivery_log(suppressed_by) WHERE suppressed_by IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE nudge_delivery_log ENABLE ROW LEVEL SECURITY;

-- Service role can read/write all logs (backend writes, analytics reads)
CREATE POLICY service_all_nudge_logs ON nudge_delivery_log
  FOR ALL USING (true) WITH CHECK (true);

-- Users can read their own logs (for diagnostics screen)
CREATE POLICY select_own_nudge_logs ON nudge_delivery_log
  FOR SELECT USING (
    firebase_uid = (auth.jwt() ->> 'sub')::TEXT
  );

COMMENT ON TABLE nudge_delivery_log IS 'Audit log for nudge suppression decisions (Session 72)';
COMMENT ON COLUMN nudge_delivery_log.suppressed_by IS 'Rule ID: daily_cap, quiet_hours, cooldown, fatigue_detection, meeting_awareness, low_recovery, streak_respect, low_confidence, mvd_active';
COMMENT ON COLUMN nudge_delivery_log.context_snapshot IS 'SuppressionContext at time of decision for debugging';


-- ============================================================================
-- Table 2: push_notification_log
-- Tracks every push notification send attempt for debugging and analytics
-- ============================================================================

CREATE TABLE push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification
  firebase_uid TEXT NOT NULL,

  -- Push token (masked for privacy - only last 8 chars stored)
  token_suffix TEXT, -- Last 8 characters of the Expo push token
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),

  -- Notification content (for debugging)
  notification_type TEXT, -- 'nudge', 'synthesis', 'reminder', etc.
  title TEXT,
  body_preview TEXT, -- First 100 chars of body

  -- Delivery result
  success BOOLEAN NOT NULL,
  ticket_id TEXT, -- Expo ticket ID if successful
  error_message TEXT, -- Error message if failed
  error_code TEXT, -- 'DeviceNotRegistered', 'MessageTooBig', etc.

  -- Related entities
  nudge_log_id UUID REFERENCES nudge_delivery_log(id), -- Link to nudge that triggered this

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_push_log_firebase_uid ON push_notification_log(firebase_uid);
CREATE INDEX idx_push_log_created_at ON push_notification_log(created_at);
CREATE INDEX idx_push_log_success ON push_notification_log(success);
CREATE INDEX idx_push_log_error_code ON push_notification_log(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX idx_push_log_nudge_log_id ON push_notification_log(nudge_log_id) WHERE nudge_log_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Service role can read/write all logs
CREATE POLICY service_all_push_logs ON push_notification_log
  FOR ALL USING (true) WITH CHECK (true);

-- Users can read their own logs (for diagnostics screen)
CREATE POLICY select_own_push_logs ON push_notification_log
  FOR SELECT USING (
    firebase_uid = (auth.jwt() ->> 'sub')::TEXT
  );

COMMENT ON TABLE push_notification_log IS 'Audit log for push notification delivery attempts (Session 72)';
COMMENT ON COLUMN push_notification_log.token_suffix IS 'Last 8 chars of ExponentPushToken for privacy';
COMMENT ON COLUMN push_notification_log.error_code IS 'Expo error codes: DeviceNotRegistered, MessageTooBig, MessageRateExceeded, InvalidCredentials';


-- ============================================================================
-- Analytics Views (Optional but useful)
-- ============================================================================

-- Daily suppression summary view
CREATE VIEW nudge_suppression_daily_summary AS
SELECT
  DATE(created_at) as day,
  suppressed_by,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE should_deliver = true) as delivered,
  COUNT(*) FILTER (WHERE should_deliver = false) as suppressed
FROM nudge_delivery_log
GROUP BY DATE(created_at), suppressed_by
ORDER BY day DESC, total_count DESC;

-- Daily push delivery summary view
CREATE VIEW push_delivery_daily_summary AS
SELECT
  DATE(created_at) as day,
  notification_type,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  COUNT(*) FILTER (WHERE error_code = 'DeviceNotRegistered') as device_unregistered
FROM push_notification_log
GROUP BY DATE(created_at), notification_type
ORDER BY day DESC, total_attempts DESC;

COMMENT ON VIEW nudge_suppression_daily_summary IS 'Daily breakdown of nudge suppression by rule';
COMMENT ON VIEW push_delivery_daily_summary IS 'Daily breakdown of push notification delivery success';
