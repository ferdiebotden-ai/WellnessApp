/**
 * Health Connect Adapter
 *
 * Normalizes Health Connect SDK responses to our unified HealthConnectReading format.
 * Handles data type conversion, timestamp normalization, and sleep stage mapping.
 *
 * Key responsibilities:
 * - Convert SDK records to HealthConnectReading format
 * - Map Health Connect sleep stages to unified SleepStage type
 * - Handle RMSSD HRV data (no conversion needed unlike Apple's SDNN)
 * - Aggregate sleep sessions into individual stage readings
 *
 * @file client/src/services/health/HealthConnectAdapter.ts
 * @author Claude Opus 4.5 (Session 50)
 * @created December 5, 2025
 */

import {
  HealthConnectReading,
  HealthConnectMetricType,
  SleepStage,
  SLEEP_STAGE_MAP,
  HeartRateVariabilityRmssdRecord,
  RestingHeartRateRecord,
  StepsRecord,
  ActiveCaloriesBurnedRecord,
  SleepSessionRecord,
  SleepStageRecord,
} from '../../types/healthConnect';

// =============================================================================
// ADAPTER CLASS
// =============================================================================

/**
 * Adapter for converting Health Connect SDK records to our unified format.
 */
export class HealthConnectAdapter {
  /**
   * Convert HRV RMSSD records to HealthConnectReading format.
   * Health Connect provides RMSSD directly (unlike Apple's SDNN).
   */
  static convertHrvRecords(
    records: HeartRateVariabilityRmssdRecord[]
  ): HealthConnectReading[] {
    return records.map((record) => {
      const timestamp = new Date(record.time).getTime();
      return {
        metric: 'hrv' as HealthConnectMetricType,
        value: record.heartRateVariabilityMillis,
        unit: 'ms',
        startDate: timestamp,
        endDate: timestamp,
        source: record.metadata?.dataOrigin || 'health_connect',
        hrvMethod: 'rmssd', // Health Connect provides RMSSD directly
      };
    });
  }

  /**
   * Convert Resting Heart Rate records to HealthConnectReading format.
   */
  static convertRhrRecords(
    records: RestingHeartRateRecord[]
  ): HealthConnectReading[] {
    return records.map((record) => {
      const timestamp = new Date(record.time).getTime();
      return {
        metric: 'rhr' as HealthConnectMetricType,
        value: record.beatsPerMinute,
        unit: 'bpm',
        startDate: timestamp,
        endDate: timestamp,
        source: record.metadata?.dataOrigin || 'health_connect',
      };
    });
  }

  /**
   * Convert Steps records to HealthConnectReading format.
   * Aggregates multiple step records if needed.
   */
  static convertStepsRecords(records: StepsRecord[]): HealthConnectReading[] {
    return records.map((record) => ({
      metric: 'steps' as HealthConnectMetricType,
      value: record.count,
      unit: 'count',
      startDate: new Date(record.startTime).getTime(),
      endDate: new Date(record.endTime).getTime(),
      source: record.metadata?.dataOrigin || 'health_connect',
    }));
  }

  /**
   * Convert Active Calories Burned records to HealthConnectReading format.
   */
  static convertActiveCaloriesRecords(
    records: ActiveCaloriesBurnedRecord[]
  ): HealthConnectReading[] {
    return records.map((record) => ({
      metric: 'activeCalories' as HealthConnectMetricType,
      value: record.energy.inKilocalories,
      unit: 'kcal',
      startDate: new Date(record.startTime).getTime(),
      endDate: new Date(record.endTime).getTime(),
      source: record.metadata?.dataOrigin || 'health_connect',
    }));
  }

  /**
   * Convert Sleep Session records to HealthConnectReading format.
   * Expands sleep sessions into individual stage readings.
   */
  static convertSleepRecords(
    records: SleepSessionRecord[]
  ): HealthConnectReading[] {
    const readings: HealthConnectReading[] = [];

    for (const record of records) {
      const source = record.metadata?.dataOrigin || 'health_connect';

      // If session has detailed stages, create a reading for each
      if (record.stages && record.stages.length > 0) {
        for (const stage of record.stages) {
          const sleepStage = this.mapSleepStage(stage.stage);
          const startMs = new Date(stage.startTime).getTime();
          const endMs = new Date(stage.endTime).getTime();
          const durationMinutes = (endMs - startMs) / (1000 * 60);

          readings.push({
            metric: 'sleep' as HealthConnectMetricType,
            value: durationMinutes,
            unit: 'minute',
            startDate: startMs,
            endDate: endMs,
            source,
            sleepStage,
          });
        }
      } else {
        // No detailed stages - create a single unspecified sleep reading
        const startMs = new Date(record.startTime).getTime();
        const endMs = new Date(record.endTime).getTime();
        const durationMinutes = (endMs - startMs) / (1000 * 60);

        readings.push({
          metric: 'sleep' as HealthConnectMetricType,
          value: durationMinutes,
          unit: 'minute',
          startDate: startMs,
          endDate: endMs,
          source,
          sleepStage: 'asleepUnspecified',
        });
      }
    }

    return readings;
  }

  /**
   * Map Health Connect sleep stage number to unified SleepStage type.
   */
  static mapSleepStage(stageNumber: number): SleepStage {
    return SLEEP_STAGE_MAP[stageNumber] || 'unknown';
  }

  /**
   * Convert any Health Connect record to HealthConnectReading format.
   * Dispatches to the appropriate converter based on record type.
   */
  static convertRecord(record: unknown): HealthConnectReading | null {
    if (!record || typeof record !== 'object') {
      return null;
    }

    const typedRecord = record as { recordType?: string };
    const recordType = typedRecord.recordType;

    switch (recordType) {
      case 'HeartRateVariabilityRmssd':
        return this.convertHrvRecords([
          record as HeartRateVariabilityRmssdRecord,
        ])[0];
      case 'RestingHeartRate':
        return this.convertRhrRecords([record as RestingHeartRateRecord])[0];
      case 'Steps':
        return this.convertStepsRecords([record as StepsRecord])[0];
      case 'ActiveCaloriesBurned':
        return this.convertActiveCaloriesRecords([
          record as ActiveCaloriesBurnedRecord,
        ])[0];
      case 'SleepSession':
        // Sleep sessions expand to multiple readings
        return this.convertSleepRecords([record as SleepSessionRecord])[0];
      default:
        console.warn(
          `[HealthConnectAdapter] Unknown record type: ${recordType}`
        );
        return null;
    }
  }

  /**
   * Aggregate multiple step readings into a daily total.
   */
  static aggregateSteps(readings: HealthConnectReading[]): number {
    return readings
      .filter((r) => r.metric === 'steps')
      .reduce((sum, r) => sum + r.value, 0);
  }

  /**
   * Aggregate multiple active calorie readings into a daily total.
   */
  static aggregateActiveCalories(readings: HealthConnectReading[]): number {
    return readings
      .filter((r) => r.metric === 'activeCalories')
      .reduce((sum, r) => sum + r.value, 0);
  }

  /**
   * Calculate total sleep duration from readings (excluding awake time).
   */
  static calculateSleepDuration(readings: HealthConnectReading[]): number {
    return readings
      .filter(
        (r) =>
          r.metric === 'sleep' &&
          r.sleepStage !== 'awake' &&
          r.sleepStage !== 'inBed'
      )
      .reduce((sum, r) => sum + r.value, 0);
  }

  /**
   * Get the most recent HRV reading.
   */
  static getLatestHrv(
    readings: HealthConnectReading[]
  ): HealthConnectReading | null {
    const hrvReadings = readings.filter((r) => r.metric === 'hrv');
    if (hrvReadings.length === 0) return null;

    return hrvReadings.reduce((latest, current) =>
      current.endDate > latest.endDate ? current : latest
    );
  }

  /**
   * Get the most recent RHR reading.
   */
  static getLatestRhr(
    readings: HealthConnectReading[]
  ): HealthConnectReading | null {
    const rhrReadings = readings.filter((r) => r.metric === 'rhr');
    if (rhrReadings.length === 0) return null;

    return rhrReadings.reduce((latest, current) =>
      current.endDate > latest.endDate ? current : latest
    );
  }

  /**
   * Get sleep readings from the most recent sleep session.
   * Finds all readings from the same session by checking time overlap.
   */
  static getLatestSleepSession(
    readings: HealthConnectReading[]
  ): HealthConnectReading[] {
    const sleepReadings = readings.filter((r) => r.metric === 'sleep');
    if (sleepReadings.length === 0) return [];

    // Sort by end date descending
    sleepReadings.sort((a, b) => b.endDate - a.endDate);

    // Find the latest session end time
    const latestEnd = sleepReadings[0].endDate;

    // Get all readings within 12 hours of the latest end time
    // This captures the full sleep session
    const SESSION_WINDOW_MS = 12 * 60 * 60 * 1000;

    return sleepReadings.filter(
      (r) => latestEnd - r.endDate < SESSION_WINDOW_MS
    );
  }

  /**
   * Calculate sleep stage percentages from readings.
   */
  static calculateSleepStagePercentages(
    readings: HealthConnectReading[]
  ): Record<SleepStage, number> {
    const sleepReadings = readings.filter((r) => r.metric === 'sleep');
    const totalMinutes = sleepReadings.reduce((sum, r) => sum + r.value, 0);

    if (totalMinutes === 0) {
      return {
        inBed: 0,
        asleepUnspecified: 0,
        awake: 0,
        asleepCore: 0,
        asleepDeep: 0,
        asleepREM: 0,
        unknown: 0,
      };
    }

    const stageTotals: Record<SleepStage, number> = {
      inBed: 0,
      asleepUnspecified: 0,
      awake: 0,
      asleepCore: 0,
      asleepDeep: 0,
      asleepREM: 0,
      unknown: 0,
    };

    for (const reading of sleepReadings) {
      const stage = reading.sleepStage || 'unknown';
      stageTotals[stage] += reading.value;
    }

    // Convert to percentages
    const percentages: Record<SleepStage, number> = {} as Record<
      SleepStage,
      number
    >;
    for (const stage of Object.keys(stageTotals) as SleepStage[]) {
      percentages[stage] = Math.round((stageTotals[stage] / totalMinutes) * 100);
    }

    return percentages;
  }
}

export default HealthConnectAdapter;
