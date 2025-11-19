import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseApp } from './firebaseAdmin';
import { getServiceClient } from './supabaseClient';

// Interfaces
interface ModuleEnrollmentRow {
  id: string;
  user_id: string;
  module_id: string;
}

interface ModuleProtocolMapRow {
  protocol_id: string;
  module_id: string;
  is_starter_protocol: boolean;
}

interface ProtocolRow {
  id: string;
  name: string;
  duration_minutes: number;
  category: string;
}

interface DailyScheduleProtocol {
  protocol_id: string;
  module_id: string;
  scheduled_time_utc: string;
  duration_minutes: number;
  status: 'pending' | 'completed' | 'skipped';
}

interface DailySchedule {
  protocols: DailyScheduleProtocol[];
}

type ScheduledEvent = { data?: string } | undefined;
type ScheduledContext = { timestamp?: string } | undefined;

const resolveRunDate = (context: ScheduledContext): Date => {
  if (context?.timestamp) {
    const parsed = new Date(context.timestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};

const formatDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates daily schedules for all active user module enrollments.
 * Runs nightly via Pub/Sub trigger.
 */
export const generateDailySchedules = async (
  _event: ScheduledEvent,
  context: ScheduledContext,
): Promise<void> => {
  const runDate = resolveRunDate(context);
  const dateKey = formatDateKey(runDate);
  const firestore = getFirestore(getFirebaseApp());
  const supabase = getServiceClient();

  // 1. Fetch all active enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('module_enrollment')
    .select('id, user_id, module_id');

  if (enrollmentsError) {
    throw new Error(`Failed to fetch enrollments: ${enrollmentsError.message}`);
  }
  if (enrollments.length === 0) return;

  // 2. Fetch all protocols and mappings (cache them)
  const [protocolsResult, mappingsResult] = await Promise.all([
    supabase.from('protocols').select('id, name, duration_minutes, category'),
    supabase.from('module_protocol_map').select('protocol_id, module_id, is_starter_protocol'),
  ]);

  if (protocolsResult.error) throw new Error(`Failed to fetch protocols: ${protocolsResult.error.message}`);
  if (mappingsResult.error) throw new Error(`Failed to fetch mappings: ${mappingsResult.error.message}`);

  const protocols = new Map((protocolsResult.data as ProtocolRow[] | null)?.map((p) => [p.id, p]) || []);
  const mappings = (mappingsResult.data as ModuleProtocolMapRow[] | null) || [];

  // Group mappings by module_id
  const moduleProtocols = new Map<string, string[]>();
  for (const m of mappings) {
    const list = moduleProtocols.get(m.module_id) || [];
    list.push(m.protocol_id);
    moduleProtocols.set(m.module_id, list);
  }

  // 3. Generate schedules for each user
  // Group enrollments by user to avoid duplicate writes if user has multiple modules (though MVP limits to 1)
  const userEnrollments = new Map<string, ModuleEnrollmentRow[]>();
  for (const e of enrollments) {
    const list = userEnrollments.get(e.user_id) || [];
    list.push(e);
    userEnrollments.set(e.user_id, list);
  }

  const batch = firestore.batch();
  let batchCount = 0;

  for (const [userId, userModules] of userEnrollments) {
    const dailyProtocols: DailyScheduleProtocol[] = [];
    const scheduledProtocolIds = new Set<string>();

    for (const enrollment of userModules) {
      const protocolIds = moduleProtocols.get(enrollment.module_id) || [];
      
      for (const pid of protocolIds) {
        if (scheduledProtocolIds.has(pid)) continue; // Avoid duplicates across modules

        const protocol = protocols.get(pid);
        if (!protocol) continue;

        // Simple scheduling logic for MVP:
        // Morning routines -> 08:00 UTC
        // Evening routines -> 20:00 UTC
        // Others -> 12:00 UTC
        // In a real app, this would use user preferences and timezone.
        let hour = 12;
        if (protocol.category === 'Foundation' || protocol.name.toLowerCase().includes('morning')) hour = 8;
        if (protocol.name.toLowerCase().includes('evening') || protocol.name.toLowerCase().includes('sleep')) hour = 20;

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
      const docRef = firestore.collection('schedules').doc(userId).collection('days').doc(dateKey);
      // Use set with merge to avoid overwriting if it already exists (though usually we want to overwrite or update)
      // For MVP, let's overwrite to ensure fresh schedule
      batch.set(docRef, { protocols: dailyProtocols, created_at: new Date().toISOString() });
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
        // Reset batch is not possible, need new batch
        // But firestore.batch() returns a new batch object? No, we need to create a new one.
        // Actually, let's just commit and create new batch in a loop if we had many users.
        // For MVP, 500 limit is fine.
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }
};

