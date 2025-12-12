import React from 'react';
import { palette } from '../theme/palette';

// Icon components
import { MorningLightIcon } from '../../assets/protocols/MorningLightIcon';
import { ColdPlungeIcon } from '../../assets/protocols/ColdPlungeIcon';
import { SaunaIcon } from '../../assets/protocols/SaunaIcon';
import { NSDRIcon } from '../../assets/protocols/NSDRIcon';
import { MovementIcon } from '../../assets/protocols/MovementIcon';
import { SleepHygieneIcon } from '../../assets/protocols/SleepHygieneIcon';
import { BreathworkIcon } from '../../assets/protocols/BreathworkIcon';
import { HydrationIcon } from '../../assets/protocols/HydrationIcon';

export interface ProtocolIconProps {
  size?: number;
  color?: string;
}

type IconComponent = React.FC<ProtocolIconProps>;

/**
 * Protocol Icon Registry
 *
 * Maps protocol IDs/slugs to their corresponding SVG icon components.
 * Falls back to emoji representation if no icon exists.
 */
const iconRegistry: Record<string, IconComponent> = {
  // Morning routines
  morning_light: MorningLightIcon,
  'morning-light': MorningLightIcon,
  light_exposure: MorningLightIcon,
  'light-exposure': MorningLightIcon,

  // Cold exposure
  cold_plunge: ColdPlungeIcon,
  'cold-plunge': ColdPlungeIcon,
  cold_exposure: ColdPlungeIcon,
  'cold-exposure': ColdPlungeIcon,
  cold_shower: ColdPlungeIcon,
  'cold-shower': ColdPlungeIcon,

  // Heat exposure
  sauna: SaunaIcon,
  heat_exposure: SaunaIcon,
  'heat-exposure': SaunaIcon,

  // Rest & recovery
  nsdr: NSDRIcon,
  NSDR: NSDRIcon,
  'non-sleep-deep-rest': NSDRIcon,
  yoga_nidra: NSDRIcon,
  'yoga-nidra': NSDRIcon,
  meditation: NSDRIcon,

  // Movement
  movement: MovementIcon,
  exercise: MovementIcon,
  zone2: MovementIcon,
  'zone-2': MovementIcon,
  walking: MovementIcon,
  cardio: MovementIcon,

  // Sleep
  sleep_hygiene: SleepHygieneIcon,
  'sleep-hygiene': SleepHygieneIcon,
  sleep: SleepHygieneIcon,
  evening_routine: SleepHygieneIcon,
  'evening-routine': SleepHygieneIcon,

  // Breathing
  breathwork: BreathworkIcon,
  breathing: BreathworkIcon,
  'cyclic-sighing': BreathworkIcon,
  cyclic_sighing: BreathworkIcon,
  'physiological-sigh': BreathworkIcon,
  'box-breathing': BreathworkIcon,

  // Hydration
  hydration: HydrationIcon,
  water: HydrationIcon,
  electrolytes: HydrationIcon,
};

/**
 * Emoji fallbacks for protocols without custom icons
 */
const emojiFallbacks: Record<string, string> = {
  morning_light: '☀️',
  cold_plunge: '❄️',
  sauna: '🔥',
  nsdr: '🧘',
  movement: '🏃',
  sleep_hygiene: '🌙',
  breathwork: '💨',
  hydration: '💧',
  caffeine: '☕',
  fasting: '⏰',
  supplements: '💊',
  nutrition: '🥗',
  default: '✨',
};

/**
 * Get the icon component for a protocol
 *
 * @param protocolId - The protocol identifier (supports various formats)
 * @returns Icon component or undefined if not found
 */
export function getProtocolIcon(protocolId: string): IconComponent | undefined {
  const normalizedId = protocolId.toLowerCase().replace(/\s+/g, '_');
  return iconRegistry[normalizedId] || iconRegistry[protocolId];
}

/**
 * Get emoji fallback for a protocol
 *
 * @param protocolId - The protocol identifier
 * @returns Emoji string
 */
export function getProtocolEmoji(protocolId: string): string {
  const normalizedId = protocolId.toLowerCase().replace(/[-\s]+/g, '_');
  return emojiFallbacks[normalizedId] || emojiFallbacks.default;
}

/**
 * Check if a protocol has a custom icon
 *
 * @param protocolId - The protocol identifier
 * @returns true if custom icon exists
 */
export function hasProtocolIcon(protocolId: string): boolean {
  return getProtocolIcon(protocolId) !== undefined;
}

export { iconRegistry };
