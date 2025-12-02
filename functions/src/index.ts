import { http } from '@google-cloud/functions-framework';
import { apiApp } from './api';

/**
 * WellnessApp Cloud Functions - Entry Point
 *
 * This module exports Cloud Functions for:
 * 1. api - HTTP-triggered Express app for all REST endpoints
 * 2. generateDailySchedules - Pub/Sub triggered daily scheduler
 * 3. generateAdaptiveNudges - Pub/Sub triggered nudge engine
 * 4. runMemoryMaintenance - Pub/Sub triggered memory decay/pruning (daily)
 * 5. onNudgeFeedback - Firestore triggered memory creation from feedback
 */

// Export Pub/Sub-triggered functions
export { generateDailySchedules, runMemoryMaintenance } from './dailyScheduler';
export { generateAdaptiveNudges } from './nudgeEngine';

// Export Firestore-triggered functions (Memory Layer)
export { onNudgeFeedback } from './onNudgeFeedback';

// Register and export Express app for Cloud Functions Gen 2
// The http() function registers the Express app as a Cloud Function handler
// The entry point 'api' must match the function name in the http() call
http('api', apiApp);
export const api = apiApp;
