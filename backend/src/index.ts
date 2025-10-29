import express from 'express';
import { onboardingCompleteHandler } from './routes/onboardingComplete';

const app = express();
app.use(express.json());

app.post('/api/onboarding/complete', (req, res) => {
  void onboardingCompleteHandler(req, res);
});

export default app;
