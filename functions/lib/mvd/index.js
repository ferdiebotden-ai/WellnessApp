"use strict";
/**
 * MVD (Minimum Viable Day) Module
 *
 * Exports all MVD-related functionality for use by other modules.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMVDStatusSummary = exports.checkAndMaybeExitMVD = exports.detectAndMaybeActivateMVD = exports.selectMVDType = exports.shouldExitMVD = exports.detectMVD = exports.hasSufficientDataForMVD = exports.buildMVDDetectionContext = exports.calculateTimezoneOffset = exports.getUserTimezone = exports.getCompletionHistory = exports.getLatestRecoveryScore = exports.closeMVDHistoryRecord = exports.logMVDActivation = exports.getMVDHistory = exports.isMVDActive = exports.initializeMVDState = exports.updateMVDCheckTimestamp = exports.deactivateMVD = exports.activateMVD = exports.getMVDState = exports.getMVDProtocolCount = exports.getMVDTypeDescription = exports.getApprovedProtocolIds = exports.isProtocolApprovedForMVD = exports.getAllMVDApprovedProtocolIds = exports.MVD_PROTOCOL_SETS = exports.DEFAULT_MVD_STATE = exports.MVD_CONFIG = void 0;
var types_1 = require("./types");
Object.defineProperty(exports, "MVD_CONFIG", { enumerable: true, get: function () { return types_1.MVD_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_MVD_STATE", { enumerable: true, get: function () { return types_1.DEFAULT_MVD_STATE; } });
// Protocol Sets
var mvdProtocols_1 = require("./mvdProtocols");
Object.defineProperty(exports, "MVD_PROTOCOL_SETS", { enumerable: true, get: function () { return mvdProtocols_1.MVD_PROTOCOL_SETS; } });
Object.defineProperty(exports, "getAllMVDApprovedProtocolIds", { enumerable: true, get: function () { return mvdProtocols_1.getAllMVDApprovedProtocolIds; } });
Object.defineProperty(exports, "isProtocolApprovedForMVD", { enumerable: true, get: function () { return mvdProtocols_1.isProtocolApprovedForMVD; } });
Object.defineProperty(exports, "getApprovedProtocolIds", { enumerable: true, get: function () { return mvdProtocols_1.getApprovedProtocolIds; } });
Object.defineProperty(exports, "getMVDTypeDescription", { enumerable: true, get: function () { return mvdProtocols_1.getMVDTypeDescription; } });
Object.defineProperty(exports, "getMVDProtocolCount", { enumerable: true, get: function () { return mvdProtocols_1.getMVDProtocolCount; } });
// State Management
var mvdStateManager_1 = require("./mvdStateManager");
Object.defineProperty(exports, "getMVDState", { enumerable: true, get: function () { return mvdStateManager_1.getMVDState; } });
Object.defineProperty(exports, "activateMVD", { enumerable: true, get: function () { return mvdStateManager_1.activateMVD; } });
Object.defineProperty(exports, "deactivateMVD", { enumerable: true, get: function () { return mvdStateManager_1.deactivateMVD; } });
Object.defineProperty(exports, "updateMVDCheckTimestamp", { enumerable: true, get: function () { return mvdStateManager_1.updateMVDCheckTimestamp; } });
Object.defineProperty(exports, "initializeMVDState", { enumerable: true, get: function () { return mvdStateManager_1.initializeMVDState; } });
Object.defineProperty(exports, "isMVDActive", { enumerable: true, get: function () { return mvdStateManager_1.isMVDActive; } });
Object.defineProperty(exports, "getMVDHistory", { enumerable: true, get: function () { return mvdStateManager_1.getMVDHistory; } });
Object.defineProperty(exports, "logMVDActivation", { enumerable: true, get: function () { return mvdStateManager_1.logMVDActivation; } });
Object.defineProperty(exports, "closeMVDHistoryRecord", { enumerable: true, get: function () { return mvdStateManager_1.closeMVDHistoryRecord; } });
// Data Fetching
var mvdDataFetcher_1 = require("./mvdDataFetcher");
Object.defineProperty(exports, "getLatestRecoveryScore", { enumerable: true, get: function () { return mvdDataFetcher_1.getLatestRecoveryScore; } });
Object.defineProperty(exports, "getCompletionHistory", { enumerable: true, get: function () { return mvdDataFetcher_1.getCompletionHistory; } });
Object.defineProperty(exports, "getUserTimezone", { enumerable: true, get: function () { return mvdDataFetcher_1.getUserTimezone; } });
Object.defineProperty(exports, "calculateTimezoneOffset", { enumerable: true, get: function () { return mvdDataFetcher_1.calculateTimezoneOffset; } });
Object.defineProperty(exports, "buildMVDDetectionContext", { enumerable: true, get: function () { return mvdDataFetcher_1.buildMVDDetectionContext; } });
Object.defineProperty(exports, "hasSufficientDataForMVD", { enumerable: true, get: function () { return mvdDataFetcher_1.hasSufficientDataForMVD; } });
// Detection Logic
var mvdDetector_1 = require("./mvdDetector");
Object.defineProperty(exports, "detectMVD", { enumerable: true, get: function () { return mvdDetector_1.detectMVD; } });
Object.defineProperty(exports, "shouldExitMVD", { enumerable: true, get: function () { return mvdDetector_1.shouldExitMVD; } });
Object.defineProperty(exports, "selectMVDType", { enumerable: true, get: function () { return mvdDetector_1.selectMVDType; } });
Object.defineProperty(exports, "detectAndMaybeActivateMVD", { enumerable: true, get: function () { return mvdDetector_1.detectAndMaybeActivateMVD; } });
Object.defineProperty(exports, "checkAndMaybeExitMVD", { enumerable: true, get: function () { return mvdDetector_1.checkAndMaybeExitMVD; } });
Object.defineProperty(exports, "getMVDStatusSummary", { enumerable: true, get: function () { return mvdDetector_1.getMVDStatusSummary; } });
