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
const modules_1 = require("./modules");
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
app.get('/api/users/me', users_1.getCurrentUser);
app.patch('/api/users/me', users_1.updateCurrentUser);
app.delete('/api/users/me', privacy_1.requestUserDeletion);
app.post('/api/users/me/export', privacy_1.requestUserDataExport);
app.get('/api/users/me/privacy', privacy_1.getPrivacyDashboardData);
app.get('/api/users/me/monetization', monetization_1.getMonetizationStatus);
// Feature routes
app.post('/api/chat', chat_1.postChat);
app.post('/api/onboarding/complete', onboarding_1.completeOnboarding);
app.post('/api/waitlist', waitlist_1.joinWaitlist);
app.post('/api/wearables/sync', wearablesSync_1.syncWearableData);
app.get('/api/protocols/search', protocolSearch_1.searchProtocols);
app.get('/api/modules', modules_1.getModules);
// Webhooks
app.post('/api/webhooks/revenuecat', revenuecatWebhook_1.handleRevenueCatWebhook);
exports.apiApp = app;
