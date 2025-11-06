declare module 'react-native-health' {
  export type HealthKitPermission = string;

  export interface HealthKitPermissions {
    permissions: {
      read: HealthKitPermission[];
      write?: HealthKitPermission[];
    };
  }

  export interface HealthKitInitOptions {
    permissions: HealthKitPermissions;
  }

  export interface HealthValue {
    value: number;
    unit?: string;
    startDate: string;
    endDate: string;
    metadata?: Record<string, unknown>;
  }

  export interface SleepSample {
    value: string;
    startDate: string;
    endDate: string;
    sourceId?: string;
  }

  export interface QuantitySample extends HealthValue {}

  export interface StepCountSample extends HealthValue {
    id?: string;
  }

  export interface HealthInputOptions {
    startDate: string;
    endDate: string;
    ascending?: boolean;
    limit?: number;
  }

  export interface DailyStepCountOptions extends HealthInputOptions {
    period?: number;
  }

  export interface AppleHealthKitType {
    Constants: {
      Permissions: {
        SleepAnalysis: HealthKitPermission;
        HeartRateVariabilitySDNN: HealthKitPermission;
        RestingHeartRate: HealthKitPermission;
        StepCount: HealthKitPermission;
      };
    };
    initHealthKit(
      permissions: HealthKitPermissions,
      callback: (error?: string) => void
    ): void;
    getSleepSamples(
      options: HealthInputOptions,
      callback: (error: string | null, results: SleepSample[]) => void
    ): void;
    getHeartRateVariabilitySamples(
      options: HealthInputOptions,
      callback: (error: string | null, results: QuantitySample[]) => void
    ): void;
    getRestingHeartRateSamples(
      options: HealthInputOptions,
      callback: (error: string | null, results: QuantitySample[]) => void
    ): void;
    getDailyStepCountSamples(
      options: DailyStepCountOptions,
      callback: (error: string | null, results: StepCountSample[]) => void
    ): void;
  }

  const AppleHealthKit: AppleHealthKitType;
  export default AppleHealthKit;
}
