import * as express from 'express';
import * as cors from 'cors';
import { createUser, getCurrentUser, updateCurrentUser } from './users';
import { postChat } from './chat';
import { joinWaitlist } from './waitlist';
import { syncWearableData } from './wearablesSync';
import { searchProtocols } from './protocolSearch';
import { requestUserDataExport, requestUserDeletion, getPrivacyDashboardData } from './privacy';
import { handleRevenueCatWebhook } from './revenuecatWebhook';

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

// Feature routes
app.post('/chat', postChat);
app.post('/waitlist', joinWaitlist);
app.post('/wearables/sync', syncWearableData);
app.get('/protocols/search', searchProtocols);

// Webhooks
app.post('/webhooks/revenuecat', handleRevenueCatWebhook);

// Modules (mock/stub for now if needed, or handled by users/me)
app.get('/modules', (req, res) => {
  // This endpoint was referenced in client api.ts but not implemented in backend
  // We can return a 200 with empty list or implement it fully
  res.status(200).json([]); 
});

export const apiApp = app;

