jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options: Record<string, unknown>) => options.ios),
  },
}));

jest.mock('react-native-health', () => ({
  Constants: {
    Permissions: {
      SleepAnalysis: 'SleepAnalysis',
      HeartRateVariabilitySDNN: 'HeartRateVariabilitySDNN',
      RestingHeartRate: 'RestingHeartRate',
      StepCount: 'StepCount',
    },
  },
  initHealthKit: jest.fn(),
  getSleepSamples: jest.fn(),
  getHeartRateVariabilitySamples: jest.fn(),
  getRestingHeartRateSamples: jest.fn(),
  getDailyStepCountSamples: jest.fn(),
}));

jest.mock('react-native-google-fit', () => ({
  Scopes: {
    FITNESS_ACTIVITY_READ: 'FITNESS_ACTIVITY_READ',
    FITNESS_SLEEP_READ: 'FITNESS_SLEEP_READ',
    FITNESS_HEART_RATE_READ: 'FITNESS_HEART_RATE_READ',
    FITNESS_BODY_READ: 'FITNESS_BODY_READ',
  },
  checkIsAuthorized: jest.fn(),
  authorize: jest.fn(),
  getSleepData: jest.fn(),
  getHeartRateSamples: jest.fn(),
  getDailyStepCountSamples: jest.fn(),
}));

import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import GoogleFit from 'react-native-google-fit';
import {
  collectWearableMetrics,
  getHrvReadings,
  getRestingHeartRateReadings,
  getSleepReadings,
  prepareWearableSyncPayload,
  requestWearablePermissions,
  type WearableMetricBundle,
} from './aggregators';

describe('wearables aggregators', () => {
  const mockedHealthKit = AppleHealthKit as jest.Mocked<typeof AppleHealthKit>;
  const mockedGoogleFit = GoogleFit as jest.Mocked<typeof GoogleFit>;

  const advancePlatform = (os: 'ios' | 'android' | 'web') => {
    (Platform as unknown as { OS: string }).OS = os;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    advancePlatform('ios');
  });

  it('requests Apple Health permissions when on iOS', async () => {
    mockedHealthKit.initHealthKit.mockImplementation((_, callback) => callback());

    const result = await requestWearablePermissions();

    expect(mockedHealthKit.initHealthKit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'authorized', source: 'apple_health' });
  });

  it('requests Google Fit permissions when on Android', async () => {
    advancePlatform('android');
    mockedGoogleFit.checkIsAuthorized.mockResolvedValue(false);
    mockedGoogleFit.authorize.mockResolvedValue({ success: true });

    const result = await requestWearablePermissions();

    expect(mockedGoogleFit.authorize).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'authorized', source: 'google_fit' });
  });

  it('maps sleep samples to standardized readings', async () => {
    const startDate = new Date('2023-01-01T06:00:00.000Z');
    const endDate = new Date('2023-01-01T07:30:00.000Z');
    mockedHealthKit.getSleepSamples.mockImplementation((_, callback) =>
      callback(null, [
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          value: 'ASLEEP',
          sourceId: 'com.example.health',
        },
      ])
    );

    const readings = await getSleepReadings({ startDate, endDate });

    expect(readings).toEqual([
      {
        metric: 'sleep',
        value: 90,
        unit: 'minute',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        source: 'apple_health',
        metadata: {
          stage: 'ASLEEP',
          sourceId: 'com.example.health',
        },
      },
    ]);
  });

  it('creates a wearable sync payload from collected metrics', async () => {
    const metrics: WearableMetricBundle = {
      sleep: [
        {
          metric: 'sleep',
          value: 60,
          unit: 'minute',
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-01-01T01:00:00.000Z',
          source: 'apple_health',
        },
      ],
      hrv: [],
      rhr: [
        {
          metric: 'rhr',
          value: 50,
          unit: 'bpm',
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-01-01T00:05:00.000Z',
          source: 'apple_health',
        },
      ],
      steps: [],
    };

    const payload = prepareWearableSyncPayload({
      userId: 'user-123',
      source: 'apple_health',
      metrics,
      capturedAt: new Date('2023-01-02T00:00:00.000Z'),
    });

    expect(payload).toEqual({
      user_id: 'user-123',
      source: 'apple_health',
      captured_at: '2023-01-02T00:00:00.000Z',
      metrics: [...metrics.sleep, ...metrics.hrv, ...metrics.rhr, ...metrics.steps],
    });
  });

  it('collects wearable metrics across all categories', async () => {
    advancePlatform('ios');
    const startDate = new Date('2023-01-01T00:00:00.000Z');
    const endDate = new Date('2023-01-02T00:00:00.000Z');

    mockedHealthKit.getSleepSamples.mockImplementation((_, callback) =>
      callback(null, [
        {
          startDate: startDate.toISOString(),
          endDate: new Date('2023-01-01T08:00:00.000Z').toISOString(),
          value: 'ASLEEP',
        },
      ])
    );
    mockedHealthKit.getHeartRateVariabilitySamples.mockImplementation((_, callback) =>
      callback(null, [
        {
          startDate: startDate.toISOString(),
          endDate: startDate.toISOString(),
          value: 65,
          unit: 'ms',
        },
      ])
    );
    mockedHealthKit.getRestingHeartRateSamples.mockImplementation((_, callback) =>
      callback(null, [
        {
          startDate: startDate.toISOString(),
          endDate: startDate.toISOString(),
          value: 52,
          unit: 'bpm',
        },
      ])
    );
    mockedHealthKit.getDailyStepCountSamples.mockImplementation((_, callback) =>
      callback(null, [
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          value: 10000,
          unit: 'count',
        },
      ])
    );

    const bundle = await collectWearableMetrics({ startDate, endDate });

    expect(bundle.sleep).toHaveLength(1);
    expect(bundle.hrv).toHaveLength(1);
    expect(bundle.rhr).toHaveLength(1);
    expect(bundle.steps).toHaveLength(1);
  });

  it('derives HRV and resting heart rate from Google Fit heart rate samples', async () => {
    advancePlatform('android');
    const startDate = new Date('2023-01-01T00:00:00.000Z');
    const endDate = new Date('2023-01-02T00:00:00.000Z');

    mockedGoogleFit.getHeartRateSamples.mockResolvedValue([
      {
        startDate: '2023-01-01T06:00:00.000Z',
        endDate: '2023-01-01T06:05:00.000Z',
        value: 60,
        sourceId: 'fit-source',
      },
      {
        startDate: '2023-01-01T06:05:00.000Z',
        endDate: '2023-01-01T06:10:00.000Z',
        value: 55,
        sourceId: 'fit-source',
      },
      {
        startDate: '2023-01-01T06:10:00.000Z',
        endDate: '2023-01-01T06:15:00.000Z',
        value: 65,
        sourceId: 'fit-source',
      },
    ]);

    const hrvReadings = await getHrvReadings({ startDate, endDate });
    const rhrReadings = await getRestingHeartRateReadings({ startDate, endDate });

    expect(hrvReadings).toHaveLength(1);
    expect(hrvReadings[0]).toMatchObject({
      metric: 'hrv',
      source: 'google_fit',
      unit: 'ms',
      metadata: expect.objectContaining({
        sampleCount: 3,
        sourceId: 'fit-source',
      }),
    });
    expect(hrvReadings[0]?.value).toBeCloseTo(134.92, 2);
    expect(hrvReadings[0]?.metadata).toEqual(
      expect.objectContaining({ sdnn: expect.any(Number) })
    );
    const hrvMetadata = hrvReadings[0]?.metadata as {
      sdnn?: number;
      sampleCount?: number;
      sourceId?: string;
    };
    expect(hrvMetadata.sdnn).toBeCloseTo(68.59, 2);

    expect(rhrReadings).toHaveLength(1);
    expect(rhrReadings[0]).toMatchObject({
      metric: 'rhr',
      source: 'google_fit',
      unit: 'bpm',
      value: 55,
      metadata: { sampleCount: 3, sourceId: 'fit-source' },
    });
  });

  it('returns empty HRV and RHR arrays when Google Fit heart rate samples are unavailable', async () => {
    advancePlatform('android');
    const startDate = new Date('2023-01-01T00:00:00.000Z');
    const endDate = new Date('2023-01-02T00:00:00.000Z');

    const moduleRef = mockedGoogleFit as unknown as {
      getHeartRateSamples?: typeof mockedGoogleFit.getHeartRateSamples;
    };
    const originalMethod = moduleRef.getHeartRateSamples;
    moduleRef.getHeartRateSamples = undefined;

    try {
      const hrvReadings = await getHrvReadings({ startDate, endDate });
      const rhrReadings = await getRestingHeartRateReadings({ startDate, endDate });

      expect(hrvReadings).toEqual([]);
      expect(rhrReadings).toEqual([]);
    } finally {
      moduleRef.getHeartRateSamples = originalMethod;
    }
  });
});
