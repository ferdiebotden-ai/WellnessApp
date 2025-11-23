import { http } from '@google-cloud/functions-framework';
import { apiApp } from './api';

// Export HTTP Cloud Function
export { generateDailySchedules } from './dailyScheduler';
export { generateAdaptiveNudges } from './nudgeEngine';

// Register and export Express app for Cloud Functions Gen 2
// The http() function registers the Express app as a Cloud Function handler
// The entry point 'api' must match the function name in the http() call
http('api', apiApp);
export const api = apiApp;
