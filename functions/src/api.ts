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
import { getModules } from './modules';

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
app.get('/api/users/me', getCurrentUser);
app.patch('/api/users/me', updateCurrentUser);
app.delete('/api/users/me', requestUserDeletion);
app.post('/api/users/me/export', requestUserDataExport);
app.get('/api/users/me/privacy', getPrivacyDashboardData);
app.get('/api/users/me/monetization', getMonetizationStatus);

// Feature routes
app.post('/api/chat', postChat);
app.post('/api/onboarding/complete', completeOnboarding);
app.post('/api/waitlist', joinWaitlist);
app.post('/api/wearables/sync', syncWearableData);
app.get('/api/protocols/search', searchProtocols);
app.get('/api/modules', getModules);

// Webhooks
app.post('/api/webhooks/revenuecat', handleRevenueCatWebhook);

export const apiApp = app;

