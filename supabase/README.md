# Supabase Configuration (Mission 001)

Mission 001 establishes Supabase as the relational datastore with Row-Level Security (RLS) bound to Firebase Authentication. The SQL migrations in this directory create the base schema and policies required for Firebase users to access their own records.

## Prerequisites

1. Supabase project (PostgreSQL 15) with `pgjwt`, `pgcrypto`, and `uuid-ossp` extensions enabled.
2. Supabase configuration updated with the shared JWT secret that the Google Cloud Functions will use when minting access tokens.
3. Firebase Admin SDK service account to validate Firebase ID tokens within Cloud Functions.

## Applying Migrations

Use the Supabase CLI to apply the migrations locally or against your remote project:

```bash
supabase db push
```

The CLI will run the SQL files in chronological order to provision the `public.users` table and enforce RLS policies.

## JWT Bridging Strategy

* Firebase Authentication issues ID tokens signed by Google. These tokens are verified inside Cloud Functions.
* After successful verification, the Cloud Function mints a short-lived Supabase JWT using `SUPABASE_JWT_SECRET`.
* RLS policies rely on the `sub` claim from the Supabase JWT, which is populated with the Firebase UID. Only rows matching the UID are accessible.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Base URL for Supabase REST/PostgREST endpoint |
| `SUPABASE_ANON_KEY` | (Optional) Use for local testing when impersonating users |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative key for migrations (never expose client-side) |
| `SUPABASE_JWT_SECRET` | Symmetric secret used to mint Supabase-compatible JWTs after Firebase verification |

Ensure the JWT secret configured in Supabase matches the secret provided to the Cloud Functions (see `functions/` directory documentation).

