import { http } from '@google-cloud/functions-framework';
import { apiApp } from './api';

// Export HTTP Cloud Function
export { generateDailySchedules } from './dailyScheduler';
export { generateAdaptiveNudges } from './nudgeEngine';

// Wrap Express app for Cloud Functions
export const api = apiApp;
