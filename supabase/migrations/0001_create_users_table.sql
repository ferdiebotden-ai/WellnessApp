-- Mission 001: Base Supabase schema for Firebase-authenticated users
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "pgjwt";

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    firebase_uid text not null unique,
    email text,
    display_name text,
    avatar_url text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists users_firebase_uid_idx on public.users(firebase_uid);

create function public.set_users_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$ language plpgsql;

create trigger users_updated_at
before update on public.users
for each row execute function public.set_users_updated_at();
