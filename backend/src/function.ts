import type { Request, Response } from 'express';
import app from './index';
import { generateDailySchedules } from './jobs/generateDailySchedules';
import { embedProtocols as embedProtocolsJob } from './jobs/embedProtocols';
import { generateAdaptiveNudges } from './jobs/generateAdaptiveNudges';

export const onboardingApi = (req: Request, res: Response) => {
  return app(req, res);
};

export const generateDailySchedulesJob = async (event: { data?: string }, context: { timestamp?: string }) => {
  await generateDailySchedules(event, context);
};

export const embedProtocols = async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    await embedProtocolsJob();
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to embed protocols', error);
    res.status(500).json({ error: 'Failed to embed protocols' });
  }
};

export const embedProtocolsPubSub = async (_event: { data?: string }) => {
  await embedProtocolsJob();
};

export const generateAdaptiveNudgesJob = async (
  event: { data?: string } | undefined,
  context: { timestamp?: string } | undefined,
) => {
  await generateAdaptiveNudges(event, context);
};
