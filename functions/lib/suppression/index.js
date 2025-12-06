"use strict";
/**
 * Suppression Engine Module
 *
 * Provides nudge suppression capabilities based on configurable rules.
 * Prevents notification fatigue while allowing critical nudges through.
 *
 * Usage:
 *   import { evaluateSuppression, buildSuppressionContext } from './suppression';
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuietHour = exports.getUserLocalHour = exports.buildSuppressionContext = exports.evaluateSuppression = exports.getRuleById = exports.SUPPRESSION_RULES = exports.RULE_IDS = exports.SUPPRESSION_CONFIG = void 0;
// Constants
var types_1 = require("./types");
Object.defineProperty(exports, "SUPPRESSION_CONFIG", { enumerable: true, get: function () { return types_1.SUPPRESSION_CONFIG; } });
Object.defineProperty(exports, "RULE_IDS", { enumerable: true, get: function () { return types_1.RULE_IDS; } });
// Rules
var rules_1 = require("./rules");
Object.defineProperty(exports, "SUPPRESSION_RULES", { enumerable: true, get: function () { return rules_1.SUPPRESSION_RULES; } });
Object.defineProperty(exports, "getRuleById", { enumerable: true, get: function () { return rules_1.getRuleById; } });
// Core functionality
var suppressionEngine_1 = require("./suppressionEngine");
Object.defineProperty(exports, "evaluateSuppression", { enumerable: true, get: function () { return suppressionEngine_1.evaluateSuppression; } });
Object.defineProperty(exports, "buildSuppressionContext", { enumerable: true, get: function () { return suppressionEngine_1.buildSuppressionContext; } });
Object.defineProperty(exports, "getUserLocalHour", { enumerable: true, get: function () { return suppressionEngine_1.getUserLocalHour; } });
Object.defineProperty(exports, "parseQuietHour", { enumerable: true, get: function () { return suppressionEngine_1.parseQuietHour; } });
