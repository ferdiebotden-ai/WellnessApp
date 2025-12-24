"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const config_1 = require("./config");
const PORT = Number.parseInt(process.env.PORT || '8080', 10);
async function startServer() {
    try {
        // Pre-warm config cache before accepting requests
        // This prevents Cloud Run cold start race conditions with env vars
        console.log('[Server] Pre-warming configuration...');
        await (0, config_1.getConfigAsync)();
        api_1.apiApp.listen(PORT, () => {
            console.log(`Wellness OS API listening on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}
startServer();
