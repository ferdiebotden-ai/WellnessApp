declare module 'react-native-google-fit' {
  export type GoogleFitScope = string;

  export interface AuthorizeOptions {
    scopes: GoogleFitScope[];
  }

  export interface AuthorizeResult {
    success: boolean;
    message?: string;
  }

  export interface FitnessValue {
    value: number;
    startDate: string;
    endDate: string;
    sourceId?: string;
    unit?: string;
    metadata?: Record<string, unknown>;
  }

  export interface SleepSegment {
    startDate: string;
    endDate: string;
    sleepStage?: number;
    sourceId?: string;
  }

  export interface AggregationOptions {
    startDate: string;
    endDate: string;
    bucketUnit?: 'MINUTE' | 'HOUR' | 'DAY';
    bucketInterval?: number;
  }

  export interface StepsOptions extends AggregationOptions {
    interval?: string;
  }

  export const Scopes: {
    FITNESS_ACTIVITY_READ: GoogleFitScope;
    FITNESS_HEART_RATE_READ: GoogleFitScope;
    FITNESS_SLEEP_READ: GoogleFitScope;
    FITNESS_BODY_READ: GoogleFitScope;
  };

  export function checkIsAuthorized(): Promise<boolean>;
  export function authorize(options: AuthorizeOptions): Promise<AuthorizeResult>;
  export function revokePermissions(): Promise<void>;
  export function isEnabled(): Promise<boolean>;

  export function getSleepData(options: AggregationOptions): Promise<SleepSegment[]>;
  export function getHeartRateSamples(options: AggregationOptions): Promise<FitnessValue[]>;
  export function getHeartRateVariabilitySamples(options: AggregationOptions): Promise<FitnessValue[]>;
  export function getDailySteps(options: StepsOptions): Promise<FitnessValue[]>;
  export function getDailyStepCountSamples(options: StepsOptions): Promise<FitnessValue[]>;
  export function getRestingHeartRateSamples(options: AggregationOptions): Promise<FitnessValue[]>;

  interface GoogleFitModule {
    Scopes: typeof Scopes;
    checkIsAuthorized: typeof checkIsAuthorized;
    authorize: typeof authorize;
    revokePermissions: typeof revokePermissions;
    isEnabled: typeof isEnabled;
    getSleepData: typeof getSleepData;
    getHeartRateSamples: typeof getHeartRateSamples;
    getHeartRateVariabilitySamples: typeof getHeartRateVariabilitySamples;
    getDailySteps: typeof getDailySteps;
    getDailyStepCountSamples: typeof getDailyStepCountSamples;
    getRestingHeartRateSamples: typeof getRestingHeartRateSamples;
  }

  const GoogleFit: GoogleFitModule;
  export default GoogleFit;
}
