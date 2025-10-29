-- Mission 001: Enforce Firebase-authenticated access to Supabase tables
alter table public.users enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'Users can select their row' and tablename = 'users'
    ) then
        create policy "Users can select their row" on public.users
            for select
            using (
                coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
            );
    end if;

    if not exists (
        select 1 from pg_policies where polname = 'Users can insert their row' and tablename = 'users'
    ) then
        create policy "Users can insert their row" on public.users
            for insert
            with check (
                coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
            );
    end if;

    if not exists (
        select 1 from pg_policies where polname = 'Users can update their row' and tablename = 'users'
    ) then
        create policy "Users can update their row" on public.users
            for update
            using (
                coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
            )
            with check (
                coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
            );
    end if;
end $$;

comment on table public.users is 'Stores profile metadata for Firebase-authenticated users. Access gated by Firebase UID via JWT claims.';
