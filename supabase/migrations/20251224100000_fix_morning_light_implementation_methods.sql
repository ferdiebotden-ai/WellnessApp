-- Fix Morning Light protocol implementation_methods
-- Previous migration (20251210120000) targeted wrong protocol ID 'morning_light_exposure'
-- Actual protocol IDs in database are 'protocol_1_morning_light' and 'protocol_2_evening_light'

-- Add implementation methods to Morning Light protocol
UPDATE public.protocols
SET implementation_methods = '[
  {
    "id": "outdoor_sunlight",
    "name": "Outdoor Sunlight",
    "description": "Get outside within 30-60 minutes of waking for 10-30 min of natural light. Most effective on clear days, but even cloudy outdoor light (1,000-5,000 lux) works.",
    "icon": "sunny",
    "duration_range": "10-15 min",
    "lux_estimate": 5000
  },
  {
    "id": "10k_lux_lamp",
    "name": "10,000 Lux Light Box",
    "description": "Use a 10,000 lux light therapy lamp positioned at eye level for 20-30 minutes while having breakfast or working. Keep 12-18 inches from face.",
    "icon": "bulb",
    "duration_range": "20-30 min",
    "lux_estimate": 10000
  },
  {
    "id": "light_bar",
    "name": "Light Bar / Panel",
    "description": "Mount a high-intensity light bar at your desk or workspace. Keep at eye level and use for 20-30 minutes during morning routine.",
    "icon": "flashlight",
    "duration_range": "20-30 min",
    "lux_estimate": 8000
  }
]'::jsonb
WHERE id = 'protocol_1_morning_light';

-- Add implementation methods to Evening Light protocol
UPDATE public.protocols
SET implementation_methods = '[
  {
    "id": "dim_ambient",
    "name": "Dim Ambient Lights",
    "description": "Switch to dim ambient lighting (<50 lux) 2-3 hours before bedtime. Use lamps instead of overhead lights.",
    "icon": "bulb-outline",
    "timing": "2-3h before bed"
  },
  {
    "id": "blue_light_glasses",
    "name": "Blue Light Glasses",
    "description": "Wear amber-tinted blue light blocking glasses that filter >90% of blue light when screens are needed.",
    "icon": "glasses-outline",
    "timing": "2h before bed"
  },
  {
    "id": "night_mode",
    "name": "Device Night Mode",
    "description": "Enable night shift or blue light filter on all devices. Set to warm/amber tones.",
    "icon": "phone-portrait-outline",
    "timing": "2h before bed"
  }
]'::jsonb
WHERE id = 'protocol_2_evening_light';

-- Verify updates
DO $$
DECLARE
  morning_methods jsonb;
  evening_methods jsonb;
BEGIN
  SELECT implementation_methods INTO morning_methods
  FROM public.protocols WHERE id = 'protocol_1_morning_light';

  SELECT implementation_methods INTO evening_methods
  FROM public.protocols WHERE id = 'protocol_2_evening_light';

  IF morning_methods IS NULL OR jsonb_array_length(morning_methods) = 0 THEN
    RAISE WARNING 'Morning Light protocol implementation_methods not updated correctly';
  ELSE
    RAISE NOTICE 'Morning Light: % implementation methods added', jsonb_array_length(morning_methods);
  END IF;

  IF evening_methods IS NULL OR jsonb_array_length(evening_methods) = 0 THEN
    RAISE WARNING 'Evening Light protocol implementation_methods not updated correctly';
  ELSE
    RAISE NOTICE 'Evening Light: % implementation methods added', jsonb_array_length(evening_methods);
  END IF;
END $$;
