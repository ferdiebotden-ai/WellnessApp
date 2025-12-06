"use strict";
/**
 * Services Module Index
 *
 * Exports all service functions for use across the application.
 *
 * @file functions/src/services/index.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaselineStatusFromDb = exports.updateMenstrualTracking = exports.initializeBaseline = exports.updateUserBaseline = exports.getUserBaseline = exports.COMPONENT_WEIGHTS = exports.getBaselineStatus = exports.shouldCalculateRecovery = exports.generateRecommendations = exports.detectEdgeCases = exports.calculateTemperaturePenalty = exports.calculateRespiratoryRateScore = exports.calculateSleepDurationScore = exports.calculateSleepQualityScore = exports.calculateRhrScore = exports.calculateHrvScore = exports.calculateRecoveryScore = void 0;
// Recovery Score Service
var recoveryScore_1 = require("./recoveryScore");
Object.defineProperty(exports, "calculateRecoveryScore", { enumerable: true, get: function () { return recoveryScore_1.calculateRecoveryScore; } });
Object.defineProperty(exports, "calculateHrvScore", { enumerable: true, get: function () { return recoveryScore_1.calculateHrvScore; } });
Object.defineProperty(exports, "calculateRhrScore", { enumerable: true, get: function () { return recoveryScore_1.calculateRhrScore; } });
Object.defineProperty(exports, "calculateSleepQualityScore", { enumerable: true, get: function () { return recoveryScore_1.calculateSleepQualityScore; } });
Object.defineProperty(exports, "calculateSleepDurationScore", { enumerable: true, get: function () { return recoveryScore_1.calculateSleepDurationScore; } });
Object.defineProperty(exports, "calculateRespiratoryRateScore", { enumerable: true, get: function () { return recoveryScore_1.calculateRespiratoryRateScore; } });
Object.defineProperty(exports, "calculateTemperaturePenalty", { enumerable: true, get: function () { return recoveryScore_1.calculateTemperaturePenalty; } });
Object.defineProperty(exports, "detectEdgeCases", { enumerable: true, get: function () { return recoveryScore_1.detectEdgeCases; } });
Object.defineProperty(exports, "generateRecommendations", { enumerable: true, get: function () { return recoveryScore_1.generateRecommendations; } });
Object.defineProperty(exports, "shouldCalculateRecovery", { enumerable: true, get: function () { return recoveryScore_1.shouldCalculateRecovery; } });
Object.defineProperty(exports, "getBaselineStatus", { enumerable: true, get: function () { return recoveryScore_1.getBaselineStatus; } });
Object.defineProperty(exports, "COMPONENT_WEIGHTS", { enumerable: true, get: function () { return recoveryScore_1.COMPONENT_WEIGHTS; } });
// Baseline Service
var baselineService_1 = require("./baselineService");
Object.defineProperty(exports, "getUserBaseline", { enumerable: true, get: function () { return baselineService_1.getUserBaseline; } });
Object.defineProperty(exports, "updateUserBaseline", { enumerable: true, get: function () { return baselineService_1.updateUserBaseline; } });
Object.defineProperty(exports, "initializeBaseline", { enumerable: true, get: function () { return baselineService_1.initializeBaseline; } });
Object.defineProperty(exports, "updateMenstrualTracking", { enumerable: true, get: function () { return baselineService_1.updateMenstrualTracking; } });
Object.defineProperty(exports, "getBaselineStatusFromDb", { enumerable: true, get: function () { return baselineService_1.getBaselineStatus; } });
