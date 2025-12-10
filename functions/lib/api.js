"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const users_1 = require("./users");
const chat_1 = require("./chat");
const waitlist_1 = require("./waitlist");
const wearablesSync_1 = require("./wearablesSync");
const protocolSearch_1 = require("./protocolSearch");
const privacy_1 = require("./privacy");
const revenuecatWebhook_1 = require("./revenuecatWebhook");
const onboarding_1 = require("./onboarding");
const monetization_1 = require("./monetization");
const correlations_1 = require("./correlations");
const modules_1 = require("./modules");
const pushTokens_1 = require("./pushTokens");
const mvdApi_1 = require("./mvd/mvdApi");
const wakeEvents_1 = require("./wakeEvents");
const calendarSync_1 = require("./calendarSync");
const recovery_1 = require("./recovery");
const manualCheckIn_1 = require("./manualCheckIn");
const protocolPersonalized_1 = require("./protocolPersonalized");
const protocolEnrollment_1 = require("./protocolEnrollment");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Health check endpoint for Cloud Run
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'wellness-api' });
});
// Routes
// User routes
app.post('/api/users', users_1.createUser);
app.post('/api/users/sync', users_1.createUser); // Alias for client sync calls
app.get('/api/users/me', users_1.getCurrentUser);
app.patch('/api/users/me', users_1.updateCurrentUser);
app.delete('/api/users/me', privacy_1.requestUserDeletion);
app.post('/api/users/me/export', privacy_1.requestUserDataExport);
app.get('/api/users/me/privacy', privacy_1.getPrivacyDashboardData);
app.get('/api/users/me/monetization', monetization_1.getMonetizationStatus);
app.get('/api/users/me/correlations', correlations_1.getUserCorrelations);
// Feature routes
app.post('/api/chat', chat_1.postChat);
app.post('/api/onboarding/complete', onboarding_1.completeOnboarding);
app.post('/api/waitlist', waitlist_1.joinWaitlist);
app.post('/api/wearables/sync', wearablesSync_1.syncWearableData);
app.get('/api/protocols/search', protocolSearch_1.searchProtocols);
app.get('/api/protocols/:id/personalized', protocolPersonalized_1.getPersonalizedProtocol);
app.post('/api/protocols/:id/enroll', protocolEnrollment_1.enrollProtocol);
app.delete('/api/protocols/:id/enroll', protocolEnrollment_1.unenrollProtocol);
app.get('/api/user/enrolled-protocols', protocolEnrollment_1.getEnrolledProtocols);
app.get('/api/modules', modules_1.getModules);
app.patch('/api/modules/enrollment', modules_1.updatePrimaryModule);
// Push notification routes
app.post('/api/push-tokens', pushTokens_1.registerPushToken);
app.delete('/api/push-tokens', pushTokens_1.deactivatePushTokens);
// MVD (Minimum Viable Day) routes
app.post('/api/mvd/activate', mvdApi_1.activateMVDManually);
app.get('/api/mvd/status', mvdApi_1.getMVDStatus);
app.post('/api/mvd/deactivate', mvdApi_1.deactivateMVDManually);
app.post('/api/mvd/detect', mvdApi_1.triggerMVDDetection);
// Wake detection routes (Phase 3 Session 4)
app.post('/api/wake-events', wakeEvents_1.createWakeEvent);
app.get('/api/wake-events/today', wakeEvents_1.getTodayWakeEvent);
// Calendar integration routes (Phase 3 Session 5)
app.post('/api/calendar/sync', calendarSync_1.syncCalendar);
app.get('/api/calendar/today', calendarSync_1.getTodayCalendarMetrics);
app.get('/api/calendar/status', calendarSync_1.getCalendarStatus);
app.delete('/api/calendar/disconnect', calendarSync_1.disconnectCalendar);
app.get('/api/calendar/recent', calendarSync_1.getRecentCalendarMetrics);
// Recovery score routes (Phase 3 Session 8)
app.get('/api/recovery', recovery_1.getRecoveryScore);
// Manual check-in routes for Lite Mode (Phase 3 Session 8)
app.post('/api/manual-check-in', manualCheckIn_1.submitManualCheckIn);
app.get('/api/manual-check-in/today', manualCheckIn_1.getTodayCheckIn);
// Webhooks
app.post('/api/webhooks/revenuecat', revenuecatWebhook_1.handleRevenueCatWebhook);
exports.apiApp = app;
