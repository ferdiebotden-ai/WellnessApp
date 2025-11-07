-- Mission 021: Waitlist entries for premium tiers

create table if not exists public.waitlist_entry (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    tier_interested_in text not null check (tier_interested_in in ('pro', 'elite')),
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_waitlist_entry_tier on public.waitlist_entry (tier_interested_in);
