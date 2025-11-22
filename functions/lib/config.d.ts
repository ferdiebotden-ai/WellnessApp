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
export declare function getPrivacyConfig(): PrivacyConfig;
export { normalizePrivateKey };
