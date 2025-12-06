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
export declare const MVD_PROTOCOL_SETS: Record<MVDType, readonly string[]>;
/**
 * Get all unique protocol IDs approved for any MVD type
 * Used for backwards compatibility with existing MVD_APPROVED_PROTOCOL_IDS
 */
export declare function getAllMVDApprovedProtocolIds(): string[];
/**
 * Check if a protocol is approved for a specific MVD type
 *
 * @param protocolId - The protocol ID to check
 * @param mvdType - The MVD type to check against (null means MVD inactive)
 * @returns true if protocol is allowed, false if it should be suppressed
 */
export declare function isProtocolApprovedForMVD(protocolId: string, mvdType: MVDType | null): boolean;
/**
 * Get the list of protocol IDs allowed for a specific MVD type
 *
 * @param mvdType - The MVD type
 * @returns Array of allowed protocol IDs
 */
export declare function getApprovedProtocolIds(mvdType: MVDType): readonly string[];
/**
 * Get human-readable description of what each MVD type allows
 * Used for UI display and logging
 */
export declare function getMVDTypeDescription(mvdType: MVDType): string;
/**
 * Get the protocol count for a specific MVD type
 * Note: Returns unique base protocols (some have dual naming)
 */
export declare function getMVDProtocolCount(mvdType: MVDType): number;
