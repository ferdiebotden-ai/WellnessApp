import express from 'express';
import { onboardingCompleteHandler } from './routes/onboardingComplete';
import { nudgeFeedbackHandler } from './routes/nudgeFeedback';

const app = express();
app.use(express.json());

app.post('/api/onboarding/complete', (req, res) => {
  void onboardingCompleteHandler(req, res);
});

app.post('/api/feedback/nudge/:nudge_log_id', (req, res) => {
  void nudgeFeedbackHandler(req, res);
});

export default app;
