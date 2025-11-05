-- Mission 009: Module & Protocol Definition
-- Creates modules, protocols, and module_protocol_map tables

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
    updated_at timestamptz not null default timezone('utc', now())
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

do $$
begin
    if not exists (
        select 1
        from pg_proc
        where proname = 'set_generic_updated_at'
          and pg_function_is_visible(oid)
    ) then
        create function public.set_generic_updated_at()
        returns trigger as $$
        begin
            new.updated_at = timezone('utc', now());
            return new;
        end;
        $$ language plpgsql;
    end if;
end;
$$;

create trigger modules_updated_at
before update on public.modules
for each row execute function public.set_generic_updated_at();

create trigger protocols_updated_at
before update on public.protocols
for each row execute function public.set_generic_updated_at();

create trigger module_protocol_map_updated_at
before update on public.module_protocol_map
for each row execute function public.set_generic_updated_at();

create index if not exists idx_module_protocol_map_module_id on public.module_protocol_map (module_id);
create index if not exists idx_module_protocol_map_protocol_id on public.module_protocol_map (protocol_id);
