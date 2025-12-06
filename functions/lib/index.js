"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.onNudgeFeedback = exports.generateWeeklySyntheses = exports.generateAdaptiveNudges = exports.runMemoryMaintenance = exports.generateDailySchedules = void 0;
const functions_framework_1 = require("@google-cloud/functions-framework");
const api_1 = require("./api");
/**
 * WellnessApp Cloud Functions - Entry Point
 *
 * This module exports Cloud Functions for:
 * 1. api - HTTP-triggered Express app for all REST endpoints
 * 2. generateDailySchedules - Pub/Sub triggered daily scheduler
 * 3. generateAdaptiveNudges - Pub/Sub triggered nudge engine
 * 4. runMemoryMaintenance - Pub/Sub triggered memory decay/pruning (daily)
 * 5. onNudgeFeedback - Firestore triggered memory creation from feedback
 * 6. generateWeeklySyntheses - Pub/Sub triggered weekly synthesis (Sunday 8:45am UTC)
 */
// Export Pub/Sub-triggered functions
var dailyScheduler_1 = require("./dailyScheduler");
Object.defineProperty(exports, "generateDailySchedules", { enumerable: true, get: function () { return dailyScheduler_1.generateDailySchedules; } });
Object.defineProperty(exports, "runMemoryMaintenance", { enumerable: true, get: function () { return dailyScheduler_1.runMemoryMaintenance; } });
var nudgeEngine_1 = require("./nudgeEngine");
Object.defineProperty(exports, "generateAdaptiveNudges", { enumerable: true, get: function () { return nudgeEngine_1.generateAdaptiveNudges; } });
var weeklySynthesisScheduler_1 = require("./weeklySynthesisScheduler");
Object.defineProperty(exports, "generateWeeklySyntheses", { enumerable: true, get: function () { return weeklySynthesisScheduler_1.generateWeeklySyntheses; } });
// Export Firestore-triggered functions (Memory Layer)
var onNudgeFeedback_1 = require("./onNudgeFeedback");
Object.defineProperty(exports, "onNudgeFeedback", { enumerable: true, get: function () { return onNudgeFeedback_1.onNudgeFeedback; } });
// Register and export Express app for Cloud Functions Gen 2
// The http() function registers the Express app as a Cloud Function handler
// The entry point 'api' must match the function name in the http() call
(0, functions_framework_1.http)('api', api_1.apiApp);
exports.api = api_1.apiApp;
