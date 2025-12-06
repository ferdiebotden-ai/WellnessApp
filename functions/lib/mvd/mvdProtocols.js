"use strict";
/**
 * MVD Protocol Sets
 *
 * Defines which protocols are allowed for each MVD type.
 * When MVD is active, only protocols in the relevant set are scheduled/nudged.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MVD_PROTOCOL_SETS = void 0;
exports.getAllMVDApprovedProtocolIds = getAllMVDApprovedProtocolIds;
exports.isProtocolApprovedForMVD = isProtocolApprovedForMVD;
exports.getApprovedProtocolIds = getApprovedProtocolIds;
exports.getMVDTypeDescription = getMVDTypeDescription;
exports.getMVDProtocolCount = getMVDProtocolCount;
/**
 * Protocol IDs allowed for each MVD type
 *
 * - full: Bare minimum (3 protocols) - for severe struggle (low recovery, heavy calendar)
 * - semi_active: Moderate reduction (5 protocols) - for consistency drops
 * - travel: Travel-optimized (4 protocols) - for timezone changes
 */
exports.MVD_PROTOCOL_SETS = {
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
};
/**
 * Get all unique protocol IDs approved for any MVD type
 * Used for backwards compatibility with existing MVD_APPROVED_PROTOCOL_IDS
 */
function getAllMVDApprovedProtocolIds() {
    const allProtocols = new Set();
    for (const protocols of Object.values(exports.MVD_PROTOCOL_SETS)) {
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
function isProtocolApprovedForMVD(protocolId, mvdType) {
    // If MVD is not active (null type), all protocols are allowed
    if (mvdType === null) {
        return true;
    }
    const allowedProtocols = exports.MVD_PROTOCOL_SETS[mvdType];
    // Case-insensitive partial match (handles 'proto_' prefix variations)
    return allowedProtocols.some((allowed) => protocolId.toLowerCase().includes(allowed.toLowerCase()) ||
        allowed.toLowerCase().includes(protocolId.toLowerCase()));
}
/**
 * Get the list of protocol IDs allowed for a specific MVD type
 *
 * @param mvdType - The MVD type
 * @returns Array of allowed protocol IDs
 */
function getApprovedProtocolIds(mvdType) {
    return exports.MVD_PROTOCOL_SETS[mvdType];
}
/**
 * Get human-readable description of what each MVD type allows
 * Used for UI display and logging
 */
function getMVDTypeDescription(mvdType) {
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
function getMVDProtocolCount(mvdType) {
    // Dedupe by removing 'proto_' prefix and counting unique
    const baseNames = new Set();
    for (const protocol of exports.MVD_PROTOCOL_SETS[mvdType]) {
        const baseName = protocol.replace(/^proto_/, '');
        baseNames.add(baseName);
    }
    return baseNames.size;
}
