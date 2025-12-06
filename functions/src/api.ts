import express from 'express';
import cors from 'cors';
import { createUser, getCurrentUser, updateCurrentUser } from './users';
import { postChat } from './chat';
import { joinWaitlist } from './waitlist';
import { syncWearableData } from './wearablesSync';
import { searchProtocols } from './protocolSearch';
import { requestUserDataExport, requestUserDeletion, getPrivacyDashboardData } from './privacy';
import { handleRevenueCatWebhook } from './revenuecatWebhook';
import { completeOnboarding } from './onboarding';
import { getMonetizationStatus } from './monetization';
import { getUserCorrelations } from './correlations';
import { getModules } from './modules';
import { registerPushToken, deactivatePushTokens } from './pushTokens';
import {
  activateMVDManually,
  getMVDStatus,
  deactivateMVDManually,
  triggerMVDDetection,
} from './mvd/mvdApi';
import { createWakeEvent, getTodayWakeEvent } from './wakeEvents';
import {
  syncCalendar,
  getTodayCalendarMetrics,
  getCalendarStatus,
  disconnectCalendar,
  getRecentCalendarMetrics,
} from './calendarSync';
import { getRecoveryScore } from './recovery';
import { submitManualCheckIn, getTodayCheckIn } from './manualCheckIn';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check endpoint for Cloud Run
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'wellness-api' });
});

// Routes
// User routes
app.post('/api/users', createUser);
app.post('/api/users/sync', createUser);  // Alias for client sync calls
app.get('/api/users/me', getCurrentUser);
app.patch('/api/users/me', updateCurrentUser);
app.delete('/api/users/me', requestUserDeletion);
app.post('/api/users/me/export', requestUserDataExport);
app.get('/api/users/me/privacy', getPrivacyDashboardData);
app.get('/api/users/me/monetization', getMonetizationStatus);
app.get('/api/users/me/correlations', getUserCorrelations);

// Feature routes
app.post('/api/chat', postChat);
app.post('/api/onboarding/complete', completeOnboarding);
app.post('/api/waitlist', joinWaitlist);
app.post('/api/wearables/sync', syncWearableData);
app.get('/api/protocols/search', searchProtocols);
app.get('/api/modules', getModules);

// Push notification routes
app.post('/api/push-tokens', registerPushToken);
app.delete('/api/push-tokens', deactivatePushTokens);

// MVD (Minimum Viable Day) routes
app.post('/api/mvd/activate', activateMVDManually);
app.get('/api/mvd/status', getMVDStatus);
app.post('/api/mvd/deactivate', deactivateMVDManually);
app.post('/api/mvd/detect', triggerMVDDetection);

// Wake detection routes (Phase 3 Session 4)
app.post('/api/wake-events', createWakeEvent);
app.get('/api/wake-events/today', getTodayWakeEvent);

// Calendar integration routes (Phase 3 Session 5)
app.post('/api/calendar/sync', syncCalendar);
app.get('/api/calendar/today', getTodayCalendarMetrics);
app.get('/api/calendar/status', getCalendarStatus);
app.delete('/api/calendar/disconnect', disconnectCalendar);
app.get('/api/calendar/recent', getRecentCalendarMetrics);

// Recovery score routes (Phase 3 Session 8)
app.get('/api/recovery', getRecoveryScore);

// Manual check-in routes for Lite Mode (Phase 3 Session 8)
app.post('/api/manual-check-in', submitManualCheckIn);
app.get('/api/manual-check-in/today', getTodayCheckIn);

// Webhooks
app.post('/api/webhooks/revenuecat', handleRevenueCatWebhook);

export const apiApp = app;

