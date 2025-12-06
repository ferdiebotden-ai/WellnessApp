"use strict";
/**
 * Safety Module - Public API
 *
 * Exports crisis detection and AI output safety scanning functions.
 * Follows barrel export pattern from suppression/ and memory/ modules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldSuppressOutput = exports.getSafeFallbackResponse = exports.scanAIOutput = exports.getSeverityDescription = exports.findMatchingKeywords = exports.hasExclusionMatch = exports.normalizeText = exports.requiresImmediateIntervention = exports.generateCrisisResponse = exports.detectCrisis = exports.getUniqueSeverities = exports.getHighestSeverity = exports.getResourcesForSeverity = exports.CRISIS_RESOURCES = exports.CRISIS_KEYWORDS = exports.SEVERITY_PRIORITY = exports.SAFETY_CONFIG = void 0;
// Constants
var types_1 = require("./types");
Object.defineProperty(exports, "SAFETY_CONFIG", { enumerable: true, get: function () { return types_1.SAFETY_CONFIG; } });
Object.defineProperty(exports, "SEVERITY_PRIORITY", { enumerable: true, get: function () { return types_1.SEVERITY_PRIORITY; } });
// Crisis Rules
var crisisRules_1 = require("./crisisRules");
Object.defineProperty(exports, "CRISIS_KEYWORDS", { enumerable: true, get: function () { return crisisRules_1.CRISIS_KEYWORDS; } });
Object.defineProperty(exports, "CRISIS_RESOURCES", { enumerable: true, get: function () { return crisisRules_1.CRISIS_RESOURCES; } });
Object.defineProperty(exports, "getResourcesForSeverity", { enumerable: true, get: function () { return crisisRules_1.getResourcesForSeverity; } });
Object.defineProperty(exports, "getHighestSeverity", { enumerable: true, get: function () { return crisisRules_1.getHighestSeverity; } });
Object.defineProperty(exports, "getUniqueSeverities", { enumerable: true, get: function () { return crisisRules_1.getUniqueSeverities; } });
// Crisis Detection
var crisisDetection_1 = require("./crisisDetection");
Object.defineProperty(exports, "detectCrisis", { enumerable: true, get: function () { return crisisDetection_1.detectCrisis; } });
Object.defineProperty(exports, "generateCrisisResponse", { enumerable: true, get: function () { return crisisDetection_1.generateCrisisResponse; } });
Object.defineProperty(exports, "requiresImmediateIntervention", { enumerable: true, get: function () { return crisisDetection_1.requiresImmediateIntervention; } });
Object.defineProperty(exports, "normalizeText", { enumerable: true, get: function () { return crisisDetection_1.normalizeText; } });
Object.defineProperty(exports, "hasExclusionMatch", { enumerable: true, get: function () { return crisisDetection_1.hasExclusionMatch; } });
Object.defineProperty(exports, "findMatchingKeywords", { enumerable: true, get: function () { return crisisDetection_1.findMatchingKeywords; } });
Object.defineProperty(exports, "getSeverityDescription", { enumerable: true, get: function () { return crisisDetection_1.getSeverityDescription; } });
// AI Output Scanner
var aiOutputScanner_1 = require("./aiOutputScanner");
Object.defineProperty(exports, "scanAIOutput", { enumerable: true, get: function () { return aiOutputScanner_1.scanAIOutput; } });
Object.defineProperty(exports, "getSafeFallbackResponse", { enumerable: true, get: function () { return aiOutputScanner_1.getSafeFallbackResponse; } });
Object.defineProperty(exports, "shouldSuppressOutput", { enumerable: true, get: function () { return aiOutputScanner_1.shouldSuppressOutput; } });
