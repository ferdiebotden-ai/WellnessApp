import type { Request, Response } from 'express';
import app from './index';

export const onboardingApi = (req: Request, res: Response) => {
  return app(req, res);
};
