"use strict";
/**
 * Calendar Service Module Exports
 *
 * @file functions/src/services/calendar/index.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyMeetingLoadMetrics = exports.classifyMeetingLoad = exports.MEETING_LOAD_THRESHOLDS = exports.getCalendarRepository = exports.CalendarRepository = exports.getCalendarService = exports.CalendarService = void 0;
// Service
var CalendarService_1 = require("./CalendarService");
Object.defineProperty(exports, "CalendarService", { enumerable: true, get: function () { return CalendarService_1.CalendarService; } });
Object.defineProperty(exports, "getCalendarService", { enumerable: true, get: function () { return CalendarService_1.getCalendarService; } });
// Repository
var CalendarRepository_1 = require("./CalendarRepository");
Object.defineProperty(exports, "CalendarRepository", { enumerable: true, get: function () { return CalendarRepository_1.CalendarRepository; } });
Object.defineProperty(exports, "getCalendarRepository", { enumerable: true, get: function () { return CalendarRepository_1.getCalendarRepository; } });
// Re-export types for convenience
var calendar_types_1 = require("../../types/calendar.types");
Object.defineProperty(exports, "MEETING_LOAD_THRESHOLDS", { enumerable: true, get: function () { return calendar_types_1.MEETING_LOAD_THRESHOLDS; } });
Object.defineProperty(exports, "classifyMeetingLoad", { enumerable: true, get: function () { return calendar_types_1.classifyMeetingLoad; } });
Object.defineProperty(exports, "emptyMeetingLoadMetrics", { enumerable: true, get: function () { return calendar_types_1.emptyMeetingLoadMetrics; } });
