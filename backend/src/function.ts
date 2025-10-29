import type { Request, Response } from 'express';
import app from './index';
import { generateDailySchedules } from './jobs/generateDailySchedules';

export const onboardingApi = (req: Request, res: Response) => {
  return app(req, res);
};

export const generateDailySchedulesJob = async (event: { data?: string }, context: { timestamp?: string }) => {
  await generateDailySchedules(event, context);
};
