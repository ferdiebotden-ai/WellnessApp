import { SupabaseClient } from '@supabase/supabase-js';
declare function getServiceClient(): SupabaseClient;
declare function signSupabaseAccessToken(uid: string): string;
export declare function getUserClient(uid: string): SupabaseClient;
export { getServiceClient, signSupabaseAccessToken };
