import { Request, Response } from 'express';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
declare const getPubSubClient: () => PubSub;
declare const getStorageClient: () => Storage;
declare const parsePubSubPayload: <T>(data: Buffer | string | undefined) => T;
export declare const requestUserDataExport: (req: Request, res: Response) => Promise<void>;
export declare const requestUserDeletion: (req: Request, res: Response) => Promise<void>;
export declare const getPrivacyDashboardData: (req: Request, res: Response) => Promise<void>;
export declare const deliverExportEmail: (recipient: string, downloadUrl: string) => Promise<void>;
type PubSubMessage = {
    message?: {
        data?: string | Buffer;
    };
};
export declare const handleUserExportJob: (event: PubSubMessage) => Promise<void>;
export declare const handleUserDeletionJob: (event: PubSubMessage) => Promise<void>;
export { getPubSubClient, getStorageClient, parsePubSubPayload };
export type { PubSubMessage };
