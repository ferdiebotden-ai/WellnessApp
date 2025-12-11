-- Add implementation_methods for Cold Exposure and Breathwork protocols
-- Session 66: Protocol Implementation Methods Expansion

-- Cold Exposure implementation methods
UPDATE public.protocols
SET implementation_methods = '[
  {
    "id": "cold_shower",
    "name": "Cold Shower",
    "description": "End your morning shower with 1-3 minutes of cold water. Start at 30 seconds and build up. Focus on slow, steady breathing.",
    "icon": "water"
  },
  {
    "id": "cold_plunge",
    "name": "Cold Plunge / Ice Bath",
    "description": "Immerse in 50-59°F (10-15°C) water for 1-5 minutes. Use a cold plunge tub, ice bath, or natural cold water source.",
    "icon": "snow"
  },
  {
    "id": "contrast_therapy",
    "name": "Contrast Therapy",
    "description": "Alternate between sauna (15-20 min) and cold plunge (1-3 min). Repeat 2-3 cycles. Always end on cold for maximum benefit.",
    "icon": "thermometer"
  },
  {
    "id": "cryotherapy",
    "name": "Cryotherapy Chamber",
    "description": "Use a whole-body cryotherapy chamber at a spa or gym. Sessions are typically 2-3 minutes at -200°F to -300°F.",
    "icon": "fitness"
  }
]'::jsonb
WHERE id = 'protocol_12_cold_exposure';

-- Breathwork implementation methods
UPDATE public.protocols
SET implementation_methods = '[
  {
    "id": "cyclic_sighing",
    "name": "Cyclic Sighing",
    "description": "Double inhale through nose (fill lungs, then top off), long slow exhale through mouth. Repeat for 5 minutes. Most effective for anxiety reduction.",
    "icon": "leaf"
  },
  {
    "id": "box_breathing",
    "name": "Box Breathing (4-4-4-4)",
    "description": "Inhale 4 sec, hold 4 sec, exhale 4 sec, hold 4 sec. Repeat 4-8 cycles. Best for acute stress and pre-performance.",
    "icon": "grid"
  },
  {
    "id": "478_breathing",
    "name": "4-7-8 Breathing",
    "description": "Inhale 4 sec, hold 7 sec, exhale 8 sec. Repeat 4 cycles. Excellent for promoting sleep and deep relaxation.",
    "icon": "moon"
  },
  {
    "id": "physiological_sigh",
    "name": "Physiological Sigh",
    "description": "Quick double inhale (nose) + long exhale (mouth). Use 1-3 sighs for rapid stress relief in the moment.",
    "icon": "pulse"
  }
]'::jsonb
WHERE id = 'protocol_11_breathwork';
