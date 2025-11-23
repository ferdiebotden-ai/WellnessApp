"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.generateAdaptiveNudges = exports.generateDailySchedules = void 0;
const functions_framework_1 = require("@google-cloud/functions-framework");
const api_1 = require("./api");
// Export HTTP Cloud Function
var dailyScheduler_1 = require("./dailyScheduler");
Object.defineProperty(exports, "generateDailySchedules", { enumerable: true, get: function () { return dailyScheduler_1.generateDailySchedules; } });
var nudgeEngine_1 = require("./nudgeEngine");
Object.defineProperty(exports, "generateAdaptiveNudges", { enumerable: true, get: function () { return nudgeEngine_1.generateAdaptiveNudges; } });
// Register and export Express app for Cloud Functions Gen 2
// The http() function registers the Express app as a Cloud Function handler
// The entry point 'api' must match the function name in the http() call
(0, functions_framework_1.http)('api', api_1.apiApp);
exports.api = api_1.apiApp;
