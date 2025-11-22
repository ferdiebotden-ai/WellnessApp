import * as express from 'express';
import * as cors from 'cors';
import { createUser, getCurrentUser, updateCurrentUser } from './users';
import { postChat } from './chat';
import { joinWaitlist } from './waitlist';
import { syncWearableData } from './wearablesSync';
import { searchProtocols } from './protocolSearch';
import { requestUserDataExport, requestUserDeletion, getPrivacyDashboardData } from './privacy';
import { handleRevenueCatWebhook } from './revenuecatWebhook';
import { completeOnboarding } from './onboarding';
import { getMonetizationStatus } from './monetization';
import { getModules } from './modules';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
// User routes
app.post('/users', createUser);
app.get('/users/me', getCurrentUser);
app.patch('/users/me', updateCurrentUser);
app.delete('/users/me', requestUserDeletion);
app.post('/users/me/export', requestUserDataExport);
app.get('/users/me/privacy', getPrivacyDashboardData);
app.get('/users/me/monetization', getMonetizationStatus);

// Feature routes
app.post('/chat', postChat);
app.post('/onboarding/complete', completeOnboarding);
app.post('/waitlist', joinWaitlist);
app.post('/wearables/sync', syncWearableData);
app.get('/protocols/search', searchProtocols);
app.get('/modules', getModules);

// Webhooks
app.post('/webhooks/revenuecat', handleRevenueCatWebhook);

export const apiApp = app;

