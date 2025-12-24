export interface ServiceConfig {
    firebaseProjectId: string;
    firebaseClientEmail: string;
    firebasePrivateKey: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;
    supabaseJwtSecret: string;
    defaultTrialDays: number;
    pineconeApiKey: string;
    pineconeIndexName: string;
    privacyExportUrlTtlHours: number;
    revenuecatWebhookSecret: string;
}
export interface PrivacyConfig {
    exportTopic: string;
    deletionTopic: string;
    exportBucket: string;
}
declare function normalizePrivateKey(key: string): string;
export declare function getConfig(): ServiceConfig;
/**
 * Async version of getConfig with retry logic for Cloud Run cold start scenarios.
 * Call this on server startup to pre-warm the config cache.
 */
export declare function getConfigAsync(): Promise<ServiceConfig>;
export declare function getPrivacyConfig(): PrivacyConfig;
export { normalizePrivateKey };
