# 🚀 Backend Activation: Manual Steps Required

We are very close! To finish activating your backend, please perform these 3 specific tasks.

## Task 1: Seed Database (Supabase)
**Status:** The `protocols` table is missing from your database.
**Action:** 
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew/sql/new).
2. Click **SQL Editor** (left sidebar) > **New Query**.
3. Paste the following SQL code and click **Run**.

```sql
-- 1. Create Tables
create table if not exists public.modules (
    id text primary key,
    name text not null,
    description text not null,
    icon_svg text,
    tier text not null check (tier in ('core', 'pro', 'elite')),
    outcome_metric text not null,
    starter_protocols text[] not null default array[]::text[],
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.protocols (
    id text primary key,
    name text not null,
    short_name text not null,
    category text not null check (category in ('Foundation', 'Performance', 'Recovery', 'Optimization', 'Meta')),
    summary text not null,
    evidence_level text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    is_active boolean default true -- Needed for seeding script
);

create table if not exists public.module_protocol_map (
    id uuid primary key default gen_random_uuid(),
    module_id text not null references public.modules (id) on delete cascade,
    protocol_id text not null references public.protocols (id) on delete cascade,
    is_starter_protocol boolean not null default false,
    tier_required text not null check (tier_required in ('core', 'pro', 'elite')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (module_id, protocol_id)
);

create table if not exists public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  timestamp timestamptz default now(),
  decision_type text,
  model_used text,
  prompt text,
  response text,
  reasoning text,
  citations text,
  module_id text,
  user_feedback text,
  user_feedback_text text,
  conversation_id text,
  intent_detected text,
  context_sources text,
  response_tokens int,
  latency_ms int,
  phi_redacted boolean,
  safety_flags text
);

-- 2. Seed Modules
insert into public.modules (id, name, description, icon_svg, tier, outcome_metric, starter_protocols)
values
    ('mod_sleep', 'Sleep Optimization', 'Restore circadian alignment and improve sleep quality.', 'moon-stars', 'core', 'Sleep Quality Score', array['proto_morning_light', 'proto_evening_light']),
    ('mod_morning', 'Morning Routine', 'Build a reliable morning anchor.', 'sunrise', 'core', 'Routine Completion %', array['proto_morning_light', 'proto_hydration']),
    ('mod_focus', 'Focus & Productivity', 'Protect deep work capacity.', 'target', 'core', 'Focus Blocks', array['proto_deep_work', 'proto_nsdr'])
on conflict (id) do nothing;

-- 3. Seed Protocols (Sample Set)
insert into public.protocols (id, name, short_name, category, summary, evidence_level, is_active)
values
    ('proto_morning_light', 'Morning Light Exposure', 'Morning Light', 'Foundation', 'View sunlight for 10-30 minutes within an hour of waking to anchor circadian rhythm.', 'High', true),
    ('proto_evening_light', 'Evening Light Management', 'Evening Light', 'Foundation', 'Dim lights 2 hours before bed to allow melatonin production.', 'High', true),
    ('proto_nsdr_session', 'Non-Sleep Deep Rest', 'NSDR', 'Recovery', 'A 20-minute guided relaxation session to reset dopamine and reduce stress.', 'High', true),
    ('proto_hydration', 'Morning Hydration', 'Hydration', 'Foundation', 'Drink 16oz water with electrolytes immediately upon waking.', 'High', true),
    ('proto_deep_work', 'Deep Work Block', 'Deep Work', 'Performance', '90 minutes of distraction-free focus work.', 'High', true)
on conflict (id) do nothing;

-- 4. Enable RLS (Security)
alter table public.protocols enable row level security;
create policy "Public read access" on public.protocols for select using (true);
```

## Task 2: Create Cloud Infrastructure (Google Cloud)
**Status:** Pub/Sub topics and Scheduler jobs are missing.
**Action:**
1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Click the **>_** icon (Activate Cloud Shell) in the top right toolbar.
3. Paste these commands and run them:

```bash
# 1. Create Pub/Sub Topics
gcloud pubsub topics create daily-tick
gcloud pubsub topics create hourly-tick

# 2. Create Scheduler Jobs
# Triggers daily at 2 AM
gcloud scheduler jobs create pubsub trigger-daily-scheduler \
  --schedule="0 2 * * *" \
  --topic=daily-tick \
  --message-body="{}" \
  --location=us-central1

# Triggers hourly
gcloud scheduler jobs create pubsub trigger-nudge-engine \
  --schedule="0 * * * *" \
  --topic=hourly-tick \
  --message-body="{}" \
  --location=us-central1
```

## Task 3: Add GitHub Secrets
**Status:** Deployment will fail without these.
**Action:** Go to GitHub > Settings > Secrets > Actions and add:

1. `FIREBASE_SERVICE_ACCOUNT`: (Paste full JSON content)
2. `FIREBASE_PROJECT_ID`: `wellness-os-app`
3. `FIREBASE_CLIENT_EMAIL`: `firebase-adminsdk-fbsvc@wellness-os-app.iam.gserviceaccount.com`
4. `FIREBASE_PRIVATE_KEY`: (The `-----BEGIN PRIVATE KEY...` part)
5. `SUPABASE_URL`: `https://vcrdogdyjljtwgoxpkew.supabase.co`
6. `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsIn...` (Your first key)
7. `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsIn...` (The new key you found)
8. `SUPABASE_JWT_SECRET`: `K254Ttg7FayQyapU7D0lcYctX05RYIw3LPB77xFxdOTAgKpn8uTi0AwTWAAb0KO8dHfUKn5Biz5gGSdjWzARjg==`
9. `PINECONE_API_KEY`: `pcsk_7QKtMB_BrozJy8hLri84nUagPWBbc8o6y9EfDNaJAG2QkijqHi8iCneGnwxoPmciG2Zip2`
10. `PINECONE_INDEX_NAME`: `wellness-protocols`
11. `REVENUECAT_WEBHOOK_SECRET`: `placeholder`
12. `GCP_SA_KEY`: (Same as `FIREBASE_SERVICE_ACCOUNT`)

## Final Step: Run Seeding Script (Local)
Once Task 1 (Supabase Tables) is done, come back here and tell me "Tables created". I will run the seeding script one last time, and it will work!

