"use strict";
/**
 * Weekly Synthesis Module
 *
 * Provides weekly metrics aggregation and correlation analysis for user progress tracking.
 * Used to generate Sunday Briefs - the "magic moment" that drives user retention.
 *
 * Usage:
 *   import { aggregateWeeklyMetrics, pearsonCorrelation } from './synthesis';
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNarrative = exports.generateWeeklyNarrative = exports.getWeekSunday = exports.getWeekMonday = exports.aggregateWeeklyMetrics = exports.getCorrelationStrength = exports.interpretCorrelation = exports.pearsonCorrelation = exports.NARRATIVE_SECTIONS = exports.OUTCOME_METRIC_NAMES = exports.OUTCOME_EXPECTED_DIRECTION = exports.SYNTHESIS_CONFIG = void 0;
// Constants
var types_1 = require("./types");
Object.defineProperty(exports, "SYNTHESIS_CONFIG", { enumerable: true, get: function () { return types_1.SYNTHESIS_CONFIG; } });
Object.defineProperty(exports, "OUTCOME_EXPECTED_DIRECTION", { enumerable: true, get: function () { return types_1.OUTCOME_EXPECTED_DIRECTION; } });
Object.defineProperty(exports, "OUTCOME_METRIC_NAMES", { enumerable: true, get: function () { return types_1.OUTCOME_METRIC_NAMES; } });
Object.defineProperty(exports, "NARRATIVE_SECTIONS", { enumerable: true, get: function () { return types_1.NARRATIVE_SECTIONS; } });
// Correlation utilities (reusable for Component 9: Outcome Correlation)
var correlations_1 = require("./correlations");
Object.defineProperty(exports, "pearsonCorrelation", { enumerable: true, get: function () { return correlations_1.pearsonCorrelation; } });
Object.defineProperty(exports, "interpretCorrelation", { enumerable: true, get: function () { return correlations_1.interpretCorrelation; } });
Object.defineProperty(exports, "getCorrelationStrength", { enumerable: true, get: function () { return correlations_1.getCorrelationStrength; } });
// Core aggregation
var weeklySynthesis_1 = require("./weeklySynthesis");
Object.defineProperty(exports, "aggregateWeeklyMetrics", { enumerable: true, get: function () { return weeklySynthesis_1.aggregateWeeklyMetrics; } });
Object.defineProperty(exports, "getWeekMonday", { enumerable: true, get: function () { return weeklySynthesis_1.getWeekMonday; } });
Object.defineProperty(exports, "getWeekSunday", { enumerable: true, get: function () { return weeklySynthesis_1.getWeekSunday; } });
// Narrative generation
var narrativeGenerator_1 = require("./narrativeGenerator");
Object.defineProperty(exports, "generateWeeklyNarrative", { enumerable: true, get: function () { return narrativeGenerator_1.generateWeeklyNarrative; } });
Object.defineProperty(exports, "validateNarrative", { enumerable: true, get: function () { return narrativeGenerator_1.validateNarrative; } });
