declare module 'react-native-health-connect' {
  export enum SdkAvailabilityStatus {
    SDK_AVAILABLE = 'SDK_AVAILABLE',
    SDK_UNAVAILABLE = 'SDK_UNAVAILABLE',
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED = 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED',
  }

  export interface Permission {
    accessType: 'read' | 'write';
    recordType: string;
  }

  export interface RequestPermissionsResult {
    granted: Permission[];
    denied: Permission[];
  }

  export interface HealthConnectRecord {
    startTime: string;
    endTime: string;
    metadata?: {
      id?: string;
      dataOrigin?: string;
    };
  }

  export interface SleepSessionRecord extends HealthConnectRecord {
    title?: string;
    notes?: string;
    stages?: Array<{
      startTime: string;
      endTime: string;
      stage: number;
    }>;
  }

  export interface StepsRecord extends HealthConnectRecord {
    count: number;
  }

  export interface HeartRateRecord extends HealthConnectRecord {
    beatsPerMinute: number;
    samples?: Array<{
      time: string;
      beatsPerMinute: number;
    }>;
  }

  export interface HeartRateVariabilityRecord extends HealthConnectRecord {
    samples?: Array<{
      time: string;
      milliseconds: number;
    }>;
  }

  export interface RestingHeartRateRecord extends HealthConnectRecord {
    beatsPerMinute: number;
  }

  export interface ReadRecordsOptions {
    recordType: string;
    timeRangeFilter?: {
      operator: 'between' | 'before' | 'after';
      startTime: string;
      endTime?: string;
    };
  }

  export function getSdkStatus(): Promise<SdkAvailabilityStatus>;
  export function initialize(): Promise<boolean>;
  export function requestPermission(permissions: Permission[]): Promise<RequestPermissionsResult>;
  export function getGrantedPermissions(): Promise<Permission[]>;
  export function readRecords<T extends HealthConnectRecord>(
    recordType: string,
    options: ReadRecordsOptions
  ): Promise<{ records: T[] }>;
}


