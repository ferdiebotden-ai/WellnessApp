# Google Cloud Functions (Mission 001)

This package contains the Node.js 20 (TypeScript) Cloud Functions that power the Wellness OS API gateway. Mission 001 delivers a reference `test-auth` function used to validate the Firebase → Supabase authentication chain.

## Project Layout

```
functions/
  api/
    test-auth/      # Reference HTTP function for JWT verification + Supabase query
  shared/           # Shared utilities, typings, and helpers (future missions)
```

## Local Development

1. Install dependencies

```bash
cd functions/api/test-auth
npm install
```

2. Copy the environment template and populate secrets:

```bash
cp .env.example .env
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` must match the values configured inside Supabase.

3. Run the function locally with the Functions Framework:

```bash
npm run build
npm run dev
```

Send a request with a Firebase ID token in the `Authorization` header:

```bash
curl -X POST \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  http://localhost:8080
```

The function verifies the Firebase token, mints a Supabase JWT, and retrieves the corresponding user row through RLS.

## Deployment

Use the `gcloud` CLI to deploy the Cloud Function after provisioning infrastructure via Terraform:

```bash
npm run build
npm run deploy
```

Deployment uses the configuration defined in `package.json` scripts and expects environment variables set on the Cloud Function resource.

