import { Request, Response } from 'express';
type RequestWithRawBody = Request & {
    rawBody?: Buffer;
};
export declare function handleRevenueCatWebhook(req: RequestWithRawBody, res: Response): Promise<void>;
export {};
