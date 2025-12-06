"use strict";
/**
 * Reasoning Module
 *
 * Provides AI reasoning capabilities including confidence scoring
 * for nudge recommendations.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Reasoning Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeOfDay = exports.calculateConfidence = exports.CATEGORY_TIME_MAPPING = exports.GOAL_KEYWORDS = exports.GOAL_MODULE_MAPPING = exports.CONFIDENCE_SUPPRESSION_THRESHOLD = exports.EVIDENCE_SCORES = exports.CONFIDENCE_WEIGHTS = void 0;
// Types
var types_1 = require("./types");
Object.defineProperty(exports, "CONFIDENCE_WEIGHTS", { enumerable: true, get: function () { return types_1.CONFIDENCE_WEIGHTS; } });
Object.defineProperty(exports, "EVIDENCE_SCORES", { enumerable: true, get: function () { return types_1.EVIDENCE_SCORES; } });
Object.defineProperty(exports, "CONFIDENCE_SUPPRESSION_THRESHOLD", { enumerable: true, get: function () { return types_1.CONFIDENCE_SUPPRESSION_THRESHOLD; } });
Object.defineProperty(exports, "GOAL_MODULE_MAPPING", { enumerable: true, get: function () { return types_1.GOAL_MODULE_MAPPING; } });
Object.defineProperty(exports, "GOAL_KEYWORDS", { enumerable: true, get: function () { return types_1.GOAL_KEYWORDS; } });
Object.defineProperty(exports, "CATEGORY_TIME_MAPPING", { enumerable: true, get: function () { return types_1.CATEGORY_TIME_MAPPING; } });
// Core functionality
var confidenceScorer_1 = require("./confidenceScorer");
Object.defineProperty(exports, "calculateConfidence", { enumerable: true, get: function () { return confidenceScorer_1.calculateConfidence; } });
Object.defineProperty(exports, "getTimeOfDay", { enumerable: true, get: function () { return confidenceScorer_1.getTimeOfDay; } });
