/**
 * MVD Protocol Sets
 *
 * Defines which protocols are allowed for each MVD type.
 * When MVD is active, only protocols in the relevant set are scheduled/nudged.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */

import type { MVDType } from './types';

/**
 * Protocol IDs allowed for each MVD type
 *
 * - full: Bare minimum (3 protocols) - for severe struggle (low recovery, heavy calendar)
 * - semi_active: Moderate reduction (5 protocols) - for consistency drops
 * - travel: Travel-optimized (4 protocols) - for timezone changes
 */
export const MVD_PROTOCOL_SETS: Record<MVDType, readonly string[]> = {
  full: [
    // Core survival protocols only
    'proto_morning_light',
    'morning_light_exposure',
    'proto_hydration_electrolytes',
    'hydration_electrolytes',
    'proto_sleep_optimization',
    'sleep_optimization',
  ],

  semi_active: [
    // Full set plus gentle movement and evening routine
    'proto_morning_light',
    'morning_light_exposure',
    'proto_hydration_electrolytes',
    'hydration_electrolytes',
    'proto_sleep_optimization',
    'sleep_optimization',
    'proto_walking_breaks',
    'walking_breaks',
    'proto_evening_light',
    'evening_light_management',
  ],

  travel: [
    // Circadian rhythm reset focus
    'proto_morning_light',
    'morning_light_exposure', // Extended 30 min for jet lag
    'proto_hydration_electrolytes',
    'hydration_electrolytes', // Increased for travel dehydration
    'proto_caffeine_timing',
    'caffeine_timing', // Adjusted for timezone
    'proto_evening_light',
    'evening_light_management',
  ],
} as const;

/**
 * Get all unique protocol IDs approved for any MVD type
 * Used for backwards compatibility with existing MVD_APPROVED_PROTOCOL_IDS
 */
export function getAllMVDApprovedProtocolIds(): string[] {
  const allProtocols = new Set<string>();
  for (const protocols of Object.values(MVD_PROTOCOL_SETS)) {
    for (const protocol of protocols) {
      allProtocols.add(protocol);
    }
  }
  return Array.from(allProtocols);
}

/**
 * Check if a protocol is approved for a specific MVD type
 *
 * @param protocolId - The protocol ID to check
 * @param mvdType - The MVD type to check against (null means MVD inactive)
 * @returns true if protocol is allowed, false if it should be suppressed
 */
export function isProtocolApprovedForMVD(
  protocolId: string,
  mvdType: MVDType | null
): boolean {
  // If MVD is not active (null type), all protocols are allowed
  if (mvdType === null) {
    return true;
  }

  const allowedProtocols = MVD_PROTOCOL_SETS[mvdType];

  // Case-insensitive partial match (handles 'proto_' prefix variations)
  return allowedProtocols.some(
    (allowed) =>
      protocolId.toLowerCase().includes(allowed.toLowerCase()) ||
      allowed.toLowerCase().includes(protocolId.toLowerCase())
  );
}

/**
 * Get the list of protocol IDs allowed for a specific MVD type
 *
 * @param mvdType - The MVD type
 * @returns Array of allowed protocol IDs
 */
export function getApprovedProtocolIds(mvdType: MVDType): readonly string[] {
  return MVD_PROTOCOL_SETS[mvdType];
}

/**
 * Get human-readable description of what each MVD type allows
 * Used for UI display and logging
 */
export function getMVDTypeDescription(mvdType: MVDType): string {
  switch (mvdType) {
    case 'full':
      return 'Bare essentials: morning light, hydration, and sleep optimization only';
    case 'semi_active':
      return 'Core protocols plus gentle walking and evening light management';
    case 'travel':
      return 'Circadian reset focus: extended light exposure and adjusted caffeine timing';
  }
}

/**
 * Get the protocol count for a specific MVD type
 * Note: Returns unique base protocols (some have dual naming)
 */
export function getMVDProtocolCount(mvdType: MVDType): number {
  // Dedupe by removing 'proto_' prefix and counting unique
  const baseNames = new Set<string>();
  for (const protocol of MVD_PROTOCOL_SETS[mvdType]) {
    const baseName = protocol.replace(/^proto_/, '');
    baseNames.add(baseName);
  }
  return baseNames.size;
}
