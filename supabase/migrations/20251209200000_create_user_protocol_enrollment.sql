-- Create user_protocol_enrollment table for per-protocol scheduling
-- Enables users to add individual protocols to their daily schedule
-- Required by: dailyScheduler, ProtocolBrowserScreen

create table if not exists public.user_protocol_enrollment (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    protocol_id text not null references public.protocols (id) on delete cascade,
    module_id text references public.modules (id) on delete set null,
    default_time_utc time not null default '12:00',
    is_active boolean not null default true,
    enrolled_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, protocol_id)
);

-- Trigger for updated_at
create trigger user_protocol_enrollment_updated_at
before update on public.user_protocol_enrollment
for each row execute function public.set_generic_updated_at();

-- Indexes for common queries
create index if not exists idx_user_protocol_enrollment_user_id
    on public.user_protocol_enrollment (user_id);
create index if not exists idx_user_protocol_enrollment_protocol_id
    on public.user_protocol_enrollment (protocol_id);
create index if not exists idx_user_protocol_enrollment_active
    on public.user_protocol_enrollment (user_id, is_active)
    where is_active = true;

-- Enable Row Level Security
alter table public.user_protocol_enrollment enable row level security;

-- RLS Policies: Users can only see/manage their own enrollments
create policy "Users can view own protocol enrollments"
    on public.user_protocol_enrollment for select
    using (auth.uid() = user_id);

create policy "Users can insert own protocol enrollments"
    on public.user_protocol_enrollment for insert
    with check (auth.uid() = user_id);

create policy "Users can update own protocol enrollments"
    on public.user_protocol_enrollment for update
    using (auth.uid() = user_id);

create policy "Users can delete own protocol enrollments"
    on public.user_protocol_enrollment for delete
    using (auth.uid() = user_id);

-- Service role bypass for backend operations (dailyScheduler)
create policy "Service role has full access to protocol enrollments"
    on public.user_protocol_enrollment for all
    using (auth.jwt() ->> 'role' = 'service_role');

comment on table public.user_protocol_enrollment is
    'Tracks individual protocol enrollments with preferred schedule times for personalized daily schedules';
comment on column public.user_protocol_enrollment.default_time_utc is
    'UTC time when protocol should be scheduled (e.g., 07:00 for morning protocols)';
comment on column public.user_protocol_enrollment.is_active is
    'Soft delete flag - false means user unenrolled but we keep history';
