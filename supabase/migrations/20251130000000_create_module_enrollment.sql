-- Create module_enrollment table for tracking user module subscriptions
-- Required by: nudgeEngine, dailyScheduler, streaks, onboarding

create table if not exists public.module_enrollment (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    module_id text not null references public.modules (id) on delete cascade,
    last_active_date date,
    enrolled_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, module_id)
);

-- Trigger for updated_at
create trigger module_enrollment_updated_at
before update on public.module_enrollment
for each row execute function public.set_generic_updated_at();

-- Indexes for common queries
create index if not exists idx_module_enrollment_user_id on public.module_enrollment (user_id);
create index if not exists idx_module_enrollment_module_id on public.module_enrollment (module_id);
create index if not exists idx_module_enrollment_last_active on public.module_enrollment (last_active_date);

-- Enable Row Level Security
alter table public.module_enrollment enable row level security;

-- RLS Policies: Users can only see/manage their own enrollments
create policy "Users can view own enrollments"
    on public.module_enrollment for select
    using (auth.uid() = user_id);

create policy "Users can insert own enrollments"
    on public.module_enrollment for insert
    with check (auth.uid() = user_id);

create policy "Users can update own enrollments"
    on public.module_enrollment for update
    using (auth.uid() = user_id);

create policy "Users can delete own enrollments"
    on public.module_enrollment for delete
    using (auth.uid() = user_id);

-- Service role bypass for backend operations
create policy "Service role has full access"
    on public.module_enrollment for all
    using (auth.jwt() ->> 'role' = 'service_role');

comment on table public.module_enrollment is 'Tracks which modules each user is enrolled in for personalized nudges and schedules';
