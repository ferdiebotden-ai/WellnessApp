import { apiApp } from './api';
import { getConfigAsync } from './config';

const PORT = Number.parseInt(process.env.PORT || '8080', 10);

async function startServer() {
  try {
    // Pre-warm config cache before accepting requests
    // This prevents Cloud Run cold start race conditions with env vars
    console.log('[Server] Pre-warming configuration...');
    await getConfigAsync();

    apiApp.listen(PORT, () => {
      console.log(`Wellness OS API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
