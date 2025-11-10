BEGIN;

-- Document social_anonymous preference for Phase 2 social features
COMMENT ON COLUMN public.users.preferences IS 
'User preferences stored as JSONB. Schema includes:
- primary_module_id: string (optional)
- nudge_tone: "motivational" | "neutral" | "minimal"
- quiet_hours_enabled: boolean
- quiet_start_time: string (HH:MM)
- quiet_end_time: string (HH:MM)
- social_anonymous: boolean (default: true) - Appear anonymously in social features';

COMMIT;

