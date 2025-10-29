# Firebase Configuration (Mission 001)

Mission 001 promotes Firebase Authentication as the system identity provider. Use the assets in this directory to standardize tenant configuration across environments.

## auth-providers.json

Defines the default authentication providers, multi-factor requirements, and email templates. Import via the Firebase CLI:

```bash
firebase auth:import --hash-algo=scrypt auth-providers.json
```

(For Mission 001 the file contains placeholders; future missions will supply production-ready settings.)

## Emulator Suite

For local development, enable the Firebase Emulator Suite and point the Next.js frontend and Cloud Functions to the emulated services. Configure `firebase.json` in future missions as the frontend scaffolding solidifies.

