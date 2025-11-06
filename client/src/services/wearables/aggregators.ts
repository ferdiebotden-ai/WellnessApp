import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import GoogleFit, { Scopes } from 'react-native-google-fit';

export type WearableSource = 'apple_health' | 'google_fit';
export type WearableMetricType = 'sleep' | 'hrv' | 'rhr' | 'steps';
export type WearablePermissionStatus = 'authorized' | 'denied' | 'unavailable';

export interface WearablePermissionResult {
  status: WearablePermissionStatus;
  source?: WearableSource;
  error?: string;
}

export interface WearableQueryOptions {
  startDate: Date;
  endDate: Date;
}

export interface WearableMetricReading {
  metric: WearableMetricType;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  source: WearableSource;
  metadata?: Record<string, unknown>;
}

export interface WearableMetricBundle {
  sleep: WearableMetricReading[];
  hrv: WearableMetricReading[];
  rhr: WearableMetricReading[];
  steps: WearableMetricReading[];
}

export interface WearableSyncPayload {
  user_id: string;
  source: WearableSource;
  captured_at: string;
  metrics: WearableMetricReading[];
}

const HEALTH_KIT_PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.StepCount,
    ],
  },
};

const GOOGLE_FIT_SCOPES = [
  Scopes.FITNESS_ACTIVITY_READ,
  Scopes.FITNESS_SLEEP_READ,
  Scopes.FITNESS_HEART_RATE_READ,
  Scopes.FITNESS_BODY_READ,
];

const toISOString = (date: Date): string => date.toISOString();

const toMinutes = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / (1000 * 60));

const ensureChronologicalOrder = <T extends { startDate: string; endDate: string }>(
  samples: T[]
): T[] =>
  [...samples].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

const mapSleepSampleToReading = (
  sample: { startDate: string; endDate: string; value?: unknown; sleepStage?: unknown; sourceId?: string },
  source: WearableSource
): WearableMetricReading => {
  const start = new Date(sample.startDate);
  const end = new Date(sample.endDate);
  return {
    metric: 'sleep',
    value: toMinutes(start, end),
    unit: 'minute',
    startDate: sample.startDate,
    endDate: sample.endDate,
    source,
    metadata: {
      stage: sample.value ?? sample.sleepStage,
      sourceId: sample.sourceId,
    },
  };
};

const mapQuantitySampleToReading = (
  sample: { startDate: string; endDate: string; value: number; unit?: string; sourceId?: string },
  metric: WearableMetricType,
  source: WearableSource
): WearableMetricReading => ({
  metric,
  value: sample.value,
  unit: sample.unit ?? inferUnitForMetric(metric),
  startDate: sample.startDate,
  endDate: sample.endDate,
  source,
  metadata: sample.sourceId ? { sourceId: sample.sourceId } : undefined,
});

const inferUnitForMetric = (metric: WearableMetricType): string => {
  switch (metric) {
    case 'sleep':
      return 'minute';
    case 'steps':
      return 'count';
    case 'hrv':
      return 'ms';
    case 'rhr':
      return 'bpm';
    default:
      return 'count';
  }
};

const requestHealthKitPermissions = async (): Promise<WearablePermissionResult> =>
  new Promise((resolve) => {
    AppleHealthKit.initHealthKit(HEALTH_KIT_PERMISSIONS, (error?: string) => {
      if (error) {
        resolve({ status: 'denied', source: 'apple_health', error });
        return;
      }
      resolve({ status: 'authorized', source: 'apple_health' });
    });
  });

const requestGoogleFitPermissions = async (): Promise<WearablePermissionResult> => {
  try {
    const alreadyAuthorized = await GoogleFit.checkIsAuthorized();
    if (alreadyAuthorized) {
      return { status: 'authorized', source: 'google_fit' };
    }

    const result = await GoogleFit.authorize({ scopes: GOOGLE_FIT_SCOPES });

    if (result.success) {
      return { status: 'authorized', source: 'google_fit' };
    }

    return {
      status: 'denied',
      source: 'google_fit',
      error: result.message ?? 'Google Fit authorization denied',
    };
  } catch (error) {
    return {
      status: 'denied',
      source: 'google_fit',
      error: error instanceof Error ? error.message : 'Unknown Google Fit error',
    };
  }
};

/**
 * Requests wearable data permissions for the active platform.
 * @returns The resulting authorization status for Apple Health or Google Fit.
 */
export const requestWearablePermissions = async (): Promise<WearablePermissionResult> => {
  if (Platform.OS === 'ios') {
    return requestHealthKitPermissions();
  }

  if (Platform.OS === 'android') {
    return requestGoogleFitPermissions();
  }

  return { status: 'unavailable' };
};

const fetchHealthKitSleep = async (options: WearableQueryOptions): Promise<WearableMetricReading[]> =>
  new Promise((resolve, reject) => {
    AppleHealthKit.getSleepSamples(
      {
        startDate: toISOString(options.startDate),
        endDate: toISOString(options.endDate),
        ascending: true,
      },
      (error, results) => {
        if (error) {
          reject(new Error(error));
          return;
        }

        resolve(ensureChronologicalOrder(results).map((sample) => mapSleepSampleToReading(sample, 'apple_health')));
      }
    );
  });

const fetchGoogleFitSleep = async (options: WearableQueryOptions): Promise<WearableMetricReading[]> => {
  const results = await GoogleFit.getSleepData({
    startDate: toISOString(options.startDate),
    endDate: toISOString(options.endDate),
    bucketUnit: 'DAY',
  });

  return ensureChronologicalOrder(results).map((sample) =>
    mapSleepSampleToReading(
      {
        startDate: sample.startDate,
        endDate: sample.endDate,
        sleepStage: sample.sleepStage,
        sourceId: sample.sourceId,
      },
      'google_fit'
    )
  );
};

const fetchHealthKitQuantitySamples = async (
  method: (
    options: { startDate: string; endDate: string; ascending?: boolean; limit?: number },
    callback: (error: string | null, results: Array<{ value: number; startDate: string; endDate: string; unit?: string; sourceId?: string }>) => void
  ) => void,
  metric: WearableMetricType,
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> =>
  new Promise((resolve, reject) => {
    method(
      {
        startDate: toISOString(options.startDate),
        endDate: toISOString(options.endDate),
        ascending: false,
      },
      (error, results) => {
        if (error) {
          reject(new Error(error));
          return;
        }

        resolve(
          ensureChronologicalOrder(results).map((sample) =>
            mapQuantitySampleToReading(sample, metric, 'apple_health')
          )
        );
      }
    );
  });

const fetchGoogleFitQuantitySamples = async (
  method: (
    options: {
      startDate: string;
      endDate: string;
      bucketUnit?: 'MINUTE' | 'HOUR' | 'DAY';
      bucketInterval?: number;
    }
  ) => Promise<Array<{ value: number; startDate: string; endDate: string; unit?: string; sourceId?: string }>>,
  metric: WearableMetricType,
  options: WearableQueryOptions,
  bucketUnit: 'MINUTE' | 'HOUR' | 'DAY' = 'DAY'
): Promise<WearableMetricReading[]> => {
  const results = await method(
    {
      startDate: toISOString(options.startDate),
      endDate: toISOString(options.endDate),
      bucketUnit,
      bucketInterval: bucketUnit === 'DAY' ? 1 : undefined,
    }
  );

  return ensureChronologicalOrder(results).map((sample) =>
    mapQuantitySampleToReading(sample, metric, 'google_fit')
  );
};

type GoogleFitHeartRateSample = {
  startDate: string;
  endDate: string;
  value: number;
  sourceId?: string;
};

const fetchGoogleFitHeartRateSamples = async (
  options: WearableQueryOptions
): Promise<GoogleFitHeartRateSample[]> => {
  const googleFitModule = GoogleFit as unknown as {
    getHeartRateSamples?: (
      params: {
        startDate: string;
        endDate: string;
        bucketUnit?: 'MINUTE' | 'HOUR' | 'DAY';
        bucketInterval?: number;
      }
    ) => Promise<GoogleFitHeartRateSample[]>;
  };

  if (typeof googleFitModule.getHeartRateSamples !== 'function') {
    return [];
  }

  const results = await googleFitModule.getHeartRateSamples({
    startDate: toISOString(options.startDate),
    endDate: toISOString(options.endDate),
    bucketUnit: 'MINUTE',
    bucketInterval: 1,
  });

  return ensureChronologicalOrder(results).filter(
    (sample): sample is GoogleFitHeartRateSample => typeof sample.value === 'number'
  );
};

const groupSamplesByDay = <T extends { startDate: string }>(samples: T[]): Record<string, T[]> =>
  samples.reduce<Record<string, T[]>>((acc, sample) => {
    const dayKey = new Date(sample.startDate).toISOString().split('T')[0];
    acc[dayKey] = acc[dayKey] ? [...acc[dayKey], sample] : [sample];
    return acc;
  }, {});

const calculateRmssd = (intervals: number[]): number | null => {
  if (intervals.length < 2) {
    return null;
  }

  const squaredDiffs = intervals
    .slice(1)
    .map((interval, index) => Math.pow(interval - intervals[index], 2));

  if (squaredDiffs.length === 0) {
    return null;
  }

  const meanSquaredDiff =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;

  return Math.sqrt(meanSquaredDiff);
};

const calculateSdnn = (intervals: number[]): number | null => {
  if (intervals.length === 0) {
    return null;
  }

  const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) /
    intervals.length;

  return Math.sqrt(variance);
};

const deriveGoogleFitHrvReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  const samples = await fetchGoogleFitHeartRateSamples(options);
  const grouped = groupSamplesByDay(samples);

  const readings = Object.values(grouped)
    .map((daySamples) => {
      if (daySamples.length < 2) {
        return null;
      }

      const sorted = ensureChronologicalOrder(daySamples);
      const intervals = sorted
        .map((sample) => (sample.value > 0 ? (60_000 / sample.value) : null))
        .filter((value): value is number => value !== null);

      const rmssd = calculateRmssd(intervals);
      if (rmssd === null) {
        return null;
      }

      const sdnn = calculateSdnn(intervals);
      const startDate = sorted[0]?.startDate;
      const endDate = sorted[sorted.length - 1]?.endDate ?? startDate;

      return {
        metric: 'hrv' as const,
        value: rmssd,
        unit: 'ms',
        startDate,
        endDate,
        source: 'google_fit' as const,
        metadata: {
          sdnn: sdnn ?? undefined,
          sampleCount: sorted.length,
          sourceId: sorted[0]?.sourceId,
        },
      } satisfies WearableMetricReading;
    })
    .filter((reading): reading is WearableMetricReading => reading !== null);

  return ensureChronologicalOrder(readings);
};

const deriveGoogleFitRestingHeartRateReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  const samples = await fetchGoogleFitHeartRateSamples(options);
  const grouped = groupSamplesByDay(samples);

  const readings = Object.values(grouped)
    .map((daySamples) => {
      if (daySamples.length === 0) {
        return null;
      }

      const sorted = ensureChronologicalOrder(daySamples);
      const resting = sorted.reduce<number | null>((lowest, sample) => {
        if (typeof sample.value !== 'number' || sample.value <= 0) {
          return lowest;
        }

        if (lowest === null) {
          return sample.value;
        }

        return Math.min(lowest, sample.value);
      }, null);

      if (resting === null) {
        return null;
      }

      const startDate = sorted[0]?.startDate;
      const endDate = sorted[sorted.length - 1]?.endDate ?? startDate;

      return {
        metric: 'rhr' as const,
        value: resting,
        unit: 'bpm',
        startDate,
        endDate,
        source: 'google_fit' as const,
        metadata: {
          sampleCount: sorted.length,
          sourceId: sorted[0]?.sourceId,
        },
      } satisfies WearableMetricReading;
    })
    .filter((reading): reading is WearableMetricReading => reading !== null);

  return ensureChronologicalOrder(readings);
};

/**
 * Retrieves sleep samples for the active platform within the provided window.
 * @param options Query window describing the start and end date.
 * @returns Normalized sleep readings ready for batching.
 */
export const getSleepReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  if (Platform.OS === 'ios') {
    return fetchHealthKitSleep(options);
  }

  if (Platform.OS === 'android') {
    return fetchGoogleFitSleep(options);
  }

  return [];
};

/**
 * Retrieves heart rate variability (HRV) samples for the active platform.
 * @param options Query window describing the start and end date.
 * @returns Normalized HRV readings.
 */
export const getHrvReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  if (Platform.OS === 'ios') {
    return fetchHealthKitQuantitySamples(
      AppleHealthKit.getHeartRateVariabilitySamples,
      'hrv',
      options
    );
  }

  if (Platform.OS === 'android') {
    return deriveGoogleFitHrvReadings(options);
  }

  return [];
};

/**
 * Retrieves resting heart rate (RHR) samples for the active platform.
 * @param options Query window describing the start and end date.
 * @returns Normalized resting heart rate readings.
 */
export const getRestingHeartRateReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  if (Platform.OS === 'ios') {
    return fetchHealthKitQuantitySamples(
      AppleHealthKit.getRestingHeartRateSamples,
      'rhr',
      options
    );
  }

  if (Platform.OS === 'android') {
    return deriveGoogleFitRestingHeartRateReadings(options);
  }

  return [];
};

/**
 * Retrieves step count samples for the active platform.
 * @param options Query window describing the start and end date.
 * @returns Normalized step count readings.
 */
export const getStepReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  if (Platform.OS === 'ios') {
    return fetchHealthKitQuantitySamples(
      AppleHealthKit.getDailyStepCountSamples,
      'steps',
      options
    );
  }

  if (Platform.OS === 'android') {
    return fetchGoogleFitQuantitySamples(
      GoogleFit.getDailyStepCountSamples,
      'steps',
      options,
      'DAY'
    );
  }

  return [];
};

/**
 * Collects all supported wearable metrics for the provided date range.
 * @param options Query window describing the start and end date.
 * @returns A grouped bundle of wearable readings.
 */
export const collectWearableMetrics = async (
  options: WearableQueryOptions
): Promise<WearableMetricBundle> => {
  const [sleep, hrv, rhr, steps] = await Promise.all([
    getSleepReadings(options),
    getHrvReadings(options),
    getRestingHeartRateReadings(options),
    getStepReadings(options),
  ]);

  return { sleep, hrv, rhr, steps };
};

const flattenMetricBundle = (bundle: WearableMetricBundle): WearableMetricReading[] => [
  ...bundle.sleep,
  ...bundle.hrv,
  ...bundle.rhr,
  ...bundle.steps,
];

/**
 * Batches wearable readings into a payload compatible with the sync endpoint.
 * @param params.userId Authenticated user identifier.
 * @param params.source Underlying wearable aggregator source.
 * @param params.metrics Grouped wearable readings to send.
 * @param params.capturedAt Timestamp for when the bundle was generated.
 * @returns Structured payload ready for POST /api/wearables/sync.
 */
export const prepareWearableSyncPayload = (
  params: {
    userId: string;
    source: WearableSource;
    metrics: WearableMetricBundle;
    capturedAt?: Date;
  }
): WearableSyncPayload => ({
  user_id: params.userId,
  source: params.source,
  captured_at: (params.capturedAt ?? new Date()).toISOString(),
  metrics: flattenMetricBundle(params.metrics),
});
