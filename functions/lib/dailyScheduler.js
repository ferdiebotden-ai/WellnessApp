"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMemoryMaintenance = exports.generateDailySchedules = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("./firebaseAdmin");
const supabaseClient_1 = require("./supabaseClient");
const memory_1 = require("./memory");
const mvd_1 = require("./mvd");
const resolveRunDate = (context) => {
    if (context?.timestamp) {
        const parsed = new Date(context.timestamp);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    return new Date();
};
const formatDateKey = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
/**
 * Generates daily schedules for all active user module enrollments.
 * Runs nightly via Pub/Sub trigger.
 */
const generateDailySchedules = async (_event, context) => {
    const runDate = resolveRunDate(context);
    const dateKey = formatDateKey(runDate);
    const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // 1. Fetch all active module enrollments and user protocol enrollments
    const [enrollmentsResult, userProtocolEnrollmentsResult] = await Promise.all([
        supabase.from('module_enrollment').select('id, user_id, module_id'),
        supabase
            .from('user_protocol_enrollment')
            .select('id, user_id, protocol_id, module_id, default_time_utc, is_active')
            .eq('is_active', true),
    ]);
    if (enrollmentsResult.error) {
        throw new Error(`Failed to fetch enrollments: ${enrollmentsResult.error.message}`);
    }
    const enrollments = enrollmentsResult.data || [];
    // Session 61: Fetch user protocol enrollments (individual protocol selections)
    const userProtocolEnrollments = (userProtocolEnrollmentsResult.data || []);
    if (userProtocolEnrollmentsResult.error) {
        console.warn(`[DailyScheduler] Failed to fetch user protocol enrollments: ${userProtocolEnrollmentsResult.error.message}`);
        // Continue with module-based scheduling only
    }
    // Group user protocol enrollments by user_id for efficient lookup
    const userProtocolsByUser = new Map();
    for (const upe of userProtocolEnrollments) {
        const list = userProtocolsByUser.get(upe.user_id) || [];
        list.push(upe);
        userProtocolsByUser.set(upe.user_id, list);
    }
    // If no module enrollments and no user protocol enrollments, nothing to do
    if (enrollments.length === 0 && userProtocolEnrollments.length === 0)
        return;
    // 2. Fetch all protocols and mappings (cache them)
    const [protocolsResult, mappingsResult] = await Promise.all([
        supabase.from('protocols').select('id, name, duration_minutes, category'),
        supabase.from('module_protocol_map').select('protocol_id, module_id, is_starter_protocol'),
    ]);
    if (protocolsResult.error)
        throw new Error(`Failed to fetch protocols: ${protocolsResult.error.message}`);
    if (mappingsResult.error)
        throw new Error(`Failed to fetch mappings: ${mappingsResult.error.message}`);
    const protocols = new Map(protocolsResult.data?.map((p) => [p.id, p]) || []);
    const mappings = mappingsResult.data || [];
    // Group mappings by module_id
    const moduleProtocols = new Map();
    for (const m of mappings) {
        const list = moduleProtocols.get(m.module_id) || [];
        list.push(m.protocol_id);
        moduleProtocols.set(m.module_id, list);
    }
    // 3. Generate schedules for each user
    // Group enrollments by user to avoid duplicate writes if user has multiple modules (though MVP limits to 1)
    const userEnrollments = new Map();
    for (const e of enrollments) {
        const list = userEnrollments.get(e.user_id) || [];
        list.push(e);
        userEnrollments.set(e.user_id, list);
    }
    // Collect all user IDs from both module enrollments and protocol enrollments
    const allUserIds = new Set([...userEnrollments.keys(), ...userProtocolsByUser.keys()]);
    const batch = firestore.batch();
    let batchCount = 0;
    for (const userId of allUserIds) {
        const userModules = userEnrollments.get(userId) || [];
        const userProtocols = userProtocolsByUser.get(userId) || [];
        const dailyProtocols = [];
        const scheduledProtocolIds = new Set();
        // Check if user is in MVD mode - filter protocols accordingly
        const mvdState = await (0, mvd_1.getMVDState)(userId);
        const mvdActive = mvdState?.mvd_active ?? false;
        const mvdType = mvdState?.mvd_type ?? null;
        // Session 61: First, add user-enrolled protocols with their preferred times
        // These take priority over module-based protocols
        for (const upe of userProtocols) {
            if (scheduledProtocolIds.has(upe.protocol_id))
                continue;
            // Filter based on MVD state if active
            if (mvdActive && mvdType && !(0, mvd_1.isProtocolApprovedForMVD)(upe.protocol_id, mvdType)) {
                continue;
            }
            const protocol = protocols.get(upe.protocol_id);
            if (!protocol)
                continue;
            // Parse the default_time_utc (format: "HH:MM")
            const [hourStr, minuteStr] = upe.default_time_utc.split(':');
            const hour = parseInt(hourStr, 10) || 12;
            const minute = parseInt(minuteStr, 10) || 0;
            const scheduledTime = new Date(runDate);
            scheduledTime.setUTCHours(hour, minute, 0, 0);
            dailyProtocols.push({
                protocol_id: upe.protocol_id,
                module_id: upe.module_id || '',
                scheduled_time_utc: scheduledTime.toISOString(),
                duration_minutes: protocol.duration_minutes || 10,
                status: 'pending',
            });
            scheduledProtocolIds.add(upe.protocol_id);
        }
        // Then add module-based protocols (original logic)
        for (const enrollment of userModules) {
            let protocolIds = moduleProtocols.get(enrollment.module_id) || [];
            // Filter protocols based on MVD state
            if (mvdActive && mvdType) {
                protocolIds = protocolIds.filter((pid) => (0, mvd_1.isProtocolApprovedForMVD)(pid, mvdType));
            }
            for (const pid of protocolIds) {
                if (scheduledProtocolIds.has(pid))
                    continue; // Avoid duplicates across modules and user enrollments
                const protocol = protocols.get(pid);
                if (!protocol)
                    continue;
                // Simple scheduling logic for MVP:
                // Morning routines -> 08:00 UTC
                // Evening routines -> 20:00 UTC
                // Others -> 12:00 UTC
                // In a real app, this would use user preferences and timezone.
                let hour = 12;
                if (protocol.category === 'Foundation' || protocol.name.toLowerCase().includes('morning'))
                    hour = 8;
                if (protocol.name.toLowerCase().includes('evening') || protocol.name.toLowerCase().includes('sleep'))
                    hour = 20;
                const scheduledTime = new Date(runDate);
                scheduledTime.setUTCHours(hour, 0, 0, 0);
                dailyProtocols.push({
                    protocol_id: pid,
                    module_id: enrollment.module_id,
                    scheduled_time_utc: scheduledTime.toISOString(),
                    duration_minutes: protocol.duration_minutes || 10,
                    status: 'pending',
                });
                scheduledProtocolIds.add(pid);
            }
        }
        if (dailyProtocols.length > 0) {
            // Write each protocol as a separate document in the 'days' subcollection
            // This matches the client's expectation of individual task documents
            const daysCollection = firestore.collection('schedules').doc(userId).collection('days');
            for (const protocol of dailyProtocols) {
                const protocolData = protocols.get(protocol.protocol_id);
                const taskDoc = {
                    title: protocolData?.name || 'Wellness Protocol',
                    status: protocol.status,
                    scheduled_for: protocol.scheduled_time_utc,
                    duration_minutes: protocol.duration_minutes,
                    protocol_id: protocol.protocol_id,
                    module_id: protocol.module_id,
                    emphasis: protocolData?.category === 'Foundation' ? 'high' : 'normal',
                    created_at: new Date().toISOString(),
                };
                // Use protocol_id + date as document ID to ensure uniqueness and idempotency
                const docId = `${protocol.protocol_id}_${dateKey}`;
                batch.set(daysCollection.doc(docId), taskDoc);
                batchCount++;
                if (batchCount >= 400) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
        }
    }
    if (batchCount > 0) {
        await batch.commit();
    }
};
exports.generateDailySchedules = generateDailySchedules;
/**
 * Memory Layer Maintenance Job
 *
 * Runs daily to:
 * 1. Apply confidence decay to all memories (PostgreSQL function)
 * 2. Prune expired/low-confidence memories for each user (max 150 per user)
 *
 * Scheduled via Cloud Scheduler (recommended: 4:00 AM UTC daily)
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
const runMemoryMaintenance = async (_event, _context) => {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    console.log('[MemoryMaintenance] Starting daily memory maintenance...');
    try {
        // 1. Apply global decay using PostgreSQL function (efficient)
        const decayedCount = await (0, memory_1.applyMemoryDecay)();
        console.log(`[MemoryMaintenance] Applied decay to ${decayedCount} memories`);
        // 2. Get all users with memories
        const { data: usersWithMemories, error: usersError } = await supabase
            .from('user_memories')
            .select('user_id')
            .gte('confidence', 0.1); // Only users with active memories
        if (usersError) {
            throw new Error(`Failed to fetch users with memories: ${usersError.message}`);
        }
        // Get unique user IDs
        const userIds = [...new Set(usersWithMemories?.map(row => row.user_id) || [])];
        console.log(`[MemoryMaintenance] Pruning memories for ${userIds.length} users`);
        // 3. Prune each user's memories (enforces 150 max, removes expired/low-confidence)
        let totalPruned = 0;
        for (const userId of userIds) {
            try {
                const prunedCount = await (0, memory_1.pruneMemories)(userId);
                totalPruned += prunedCount;
                if (prunedCount > 0) {
                    console.log(`[MemoryMaintenance] Pruned ${prunedCount} memories for user ${userId}`);
                }
            }
            catch (pruneError) {
                console.error(`[MemoryMaintenance] Failed to prune user ${userId}:`, pruneError);
                // Continue with other users
            }
        }
        console.log(`[MemoryMaintenance] Complete. Decayed: ${decayedCount}, Pruned: ${totalPruned}`);
    }
    catch (error) {
        console.error('[MemoryMaintenance] Failed:', error);
        throw error;
    }
};
exports.runMemoryMaintenance = runMemoryMaintenance;
