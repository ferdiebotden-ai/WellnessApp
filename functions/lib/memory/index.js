"use strict";
/**
 * Memory Layer Module
 *
 * Exports all Memory Layer functionality for use by other modules.
 *
 * Usage:
 *   import { storeMemory, getRelevantMemories } from './memory';
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProtocolEffectivenessMemory = exports.createFromStatedPreference = exports.createFromNudgeFeedback = exports.getMemoryStats = exports.pruneMemories = exports.applyMemoryDecay = exports.deleteAllUserMemories = exports.deleteMemory = exports.updateMemory = exports.getAllUserMemories = exports.getRelevantMemories = exports.reinforceMemory = exports.storeMemory = exports.DEFAULT_EXPIRATION_DAYS = exports.MEMORY_TYPE_PRIORITY = exports.MEMORY_CONFIG = void 0;
// Types
var types_1 = require("./types");
Object.defineProperty(exports, "MEMORY_CONFIG", { enumerable: true, get: function () { return types_1.MEMORY_CONFIG; } });
Object.defineProperty(exports, "MEMORY_TYPE_PRIORITY", { enumerable: true, get: function () { return types_1.MEMORY_TYPE_PRIORITY; } });
Object.defineProperty(exports, "DEFAULT_EXPIRATION_DAYS", { enumerable: true, get: function () { return types_1.DEFAULT_EXPIRATION_DAYS; } });
// Core CRUD operations
var userMemory_1 = require("./userMemory");
Object.defineProperty(exports, "storeMemory", { enumerable: true, get: function () { return userMemory_1.storeMemory; } });
Object.defineProperty(exports, "reinforceMemory", { enumerable: true, get: function () { return userMemory_1.reinforceMemory; } });
Object.defineProperty(exports, "getRelevantMemories", { enumerable: true, get: function () { return userMemory_1.getRelevantMemories; } });
Object.defineProperty(exports, "getAllUserMemories", { enumerable: true, get: function () { return userMemory_1.getAllUserMemories; } });
Object.defineProperty(exports, "updateMemory", { enumerable: true, get: function () { return userMemory_1.updateMemory; } });
Object.defineProperty(exports, "deleteMemory", { enumerable: true, get: function () { return userMemory_1.deleteMemory; } });
Object.defineProperty(exports, "deleteAllUserMemories", { enumerable: true, get: function () { return userMemory_1.deleteAllUserMemories; } });
// Decay and maintenance
var userMemory_2 = require("./userMemory");
Object.defineProperty(exports, "applyMemoryDecay", { enumerable: true, get: function () { return userMemory_2.applyMemoryDecay; } });
Object.defineProperty(exports, "pruneMemories", { enumerable: true, get: function () { return userMemory_2.pruneMemories; } });
Object.defineProperty(exports, "getMemoryStats", { enumerable: true, get: function () { return userMemory_2.getMemoryStats; } });
// Convenience creators
var userMemory_3 = require("./userMemory");
Object.defineProperty(exports, "createFromNudgeFeedback", { enumerable: true, get: function () { return userMemory_3.createFromNudgeFeedback; } });
Object.defineProperty(exports, "createFromStatedPreference", { enumerable: true, get: function () { return userMemory_3.createFromStatedPreference; } });
Object.defineProperty(exports, "createProtocolEffectivenessMemory", { enumerable: true, get: function () { return userMemory_3.createProtocolEffectivenessMemory; } });
