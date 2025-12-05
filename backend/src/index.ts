import express from 'express';
import cors from 'cors';
import { onboardingCompleteHandler } from './routes/onboardingComplete';
import { nudgeFeedbackHandler } from './routes/nudgeFeedback';
import { userSyncHandler } from './routes/userSync';

const app = express();

// CORS configuration - allow localhost for development and production origins
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
    // Add production domains here when deploying
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// User sync endpoint - creates/retrieves Supabase user record from Firebase token
app.post('/api/users/sync', (req, res) => {
  void userSyncHandler(req, res);
});

app.post('/api/onboarding/complete', (req, res) => {
  void onboardingCompleteHandler(req, res);
});

app.post('/api/feedback/nudge/:nudge_log_id', (req, res) => {
  void nudgeFeedbackHandler(req, res);
});

export default app;
