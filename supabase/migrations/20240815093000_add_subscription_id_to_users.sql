BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS subscription_id TEXT;

CREATE INDEX IF NOT EXISTS users_subscription_id_idx ON public.users (subscription_id);

COMMIT;
