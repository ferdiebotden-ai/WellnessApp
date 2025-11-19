import { 
  WearableMetricBundle, 
  WearablePermissionResult, 
  WearableQueryOptions, 
  WearableSyncPayload,
  WearableSource,
  WearableMetricReading
} from './aggregators';

export * from './aggregators';

/**
 * Requests wearable data permissions for the active platform.
 * @returns The resulting authorization status for Apple Health or Google Fit.
 */
export const requestWearablePermissions = async (): Promise<WearablePermissionResult> => {
  console.log('WEB MOCK: Wearable permissions requested');
  return { status: 'authorized', source: 'apple_health' };
};

/**
 * Retrieves sleep samples for the active platform within the provided window.
 * @param options Query window describing the start and end date.
 * @returns Normalized sleep readings ready for batching.
 */
export const getSleepReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  console.log('WEB MOCK: Sleep readings requested');
  return [
    {
      metric: 'sleep',
      value: 450,
      unit: 'minute',
      startDate: options.startDate.toISOString(),
      endDate: options.endDate.toISOString(),
      source: 'apple_health',
      metadata: { stage: 1 }
    }
  ];
};

/**
 * Retrieves heart rate variability (HRV) samples for the active platform.
 * @param options Query window describing the start and end date.
 * @returns Normalized HRV readings.
 */
export const getHrvReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  console.log('WEB MOCK: HRV readings requested');
  return [
    {
      metric: 'hrv',
      value: 55,
      unit: 'ms',
      startDate: options.startDate.toISOString(),
      endDate: options.endDate.toISOString(),
      source: 'apple_health',
    }
  ];
};

/**
 * Retrieves resting heart rate (RHR) samples for the active platform.
 * @param options Query window describing the start and end date.
 * @returns Normalized resting heart rate readings.
 */
export const getRestingHeartRateReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  console.log('WEB MOCK: RHR readings requested');
  return [
    {
      metric: 'rhr',
      value: 62,
      unit: 'bpm',
      startDate: options.startDate.toISOString(),
      endDate: options.endDate.toISOString(),
      source: 'apple_health',
    }
  ];
};

/**
 * Retrieves step count samples for the active platform.
 * @param options Query window describing the start and end date.
 * @returns Normalized step count readings.
 */
export const getStepReadings = async (
  options: WearableQueryOptions
): Promise<WearableMetricReading[]> => {
  console.log('WEB MOCK: Step readings requested');
  return [
    {
      metric: 'steps',
      value: 8500,
      unit: 'count',
      startDate: options.startDate.toISOString(),
      endDate: options.endDate.toISOString(),
      source: 'apple_health',
    }
  ];
};

/**
 * Collects all supported wearable metrics for the provided date range.
 * @param options Query window describing the start and end date.
 * @returns A grouped bundle of wearable readings.
 */
export const collectWearableMetrics = async (
  options: WearableQueryOptions
): Promise<WearableMetricBundle> => {
  console.log('WEB MOCK: Collecting all wearable metrics');
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

