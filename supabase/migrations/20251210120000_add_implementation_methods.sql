-- Add implementation_methods column to protocols table
-- Stores alternative ways to implement a protocol (e.g., Morning Light can be outdoor sun OR 10k lux lamp)
-- Session 63: Protocol Implementation Flexibility

-- Add JSONB column for implementation methods
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS implementation_methods JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.protocols.implementation_methods IS
'JSON array of implementation options. Each option has: id, name, description, icon (optional). Example: [{"id": "outdoor", "name": "Outdoor Sunlight", "description": "Natural morning light exposure", "icon": "sunny"}]';

-- Seed Morning Light protocol with implementation methods
UPDATE public.protocols
SET implementation_methods = '[
  {
    "id": "outdoor_sunlight",
    "name": "Outdoor Sunlight",
    "description": "Get outside within 30-60 minutes of waking for 10-30 min of natural light exposure. Most effective on clear days.",
    "icon": "sunny"
  },
  {
    "id": "10k_lux_lamp",
    "name": "10,000 Lux Light Box",
    "description": "Use a 10,000 lux light therapy lamp positioned at eye level for 20-30 minutes while having breakfast or working.",
    "icon": "bulb"
  },
  {
    "id": "light_bar",
    "name": "Light Bar / Panel",
    "description": "Mount a high-intensity light bar at your desk or workspace. Keep it at eye level and use for 20-30 minutes.",
    "icon": "flashlight"
  }
]'::jsonb
WHERE id = 'morning_light_exposure';
