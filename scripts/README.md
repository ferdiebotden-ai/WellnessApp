# Automation Scripts (Mission 001)

> **Environment:** These bash scripts run natively in WSL2 (Ubuntu).
> Run from: `cd ~/projects/WellnessApp`

## verify_auth_flow.sh

The `verify_auth_flow.sh` helper script invokes the deployed `test-auth` Cloud Function using a Firebase ID token. Use it after deployment to confirm that Firebase authentication and Supabase RLS are configured correctly.

```bash
# From WSL terminal
cd ~/projects/WellnessApp

# Set environment variables
export FIREBASE_ID_TOKEN="$(gcloud auth print-identity-token)" # replace with real Firebase ID token
export FUNCTION_URL="https://<region>-<project>.cloudfunctions.net/test-auth"

# Make script executable (first time only)
chmod +x ./scripts/verify_auth_flow.sh

# Run the script
./scripts/verify_auth_flow.sh
```

A successful response confirms that:

1. Firebase ID tokens are validated by the Cloud Function.
2. Supabase JWT minting uses the configured shared secret.
3. Supabase RLS grants access only to the user's row.

---

## Other Scripts

| Script | Purpose |
|--------|---------|
| `seed-pinecone.ts` | Seeds protocol embeddings to Pinecone vector database |

Run TypeScript scripts with:
```bash
npx ts-node scripts/seed-pinecone.ts
```

