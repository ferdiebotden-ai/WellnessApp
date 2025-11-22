-- Add headline column to modules table
-- This is a short tagline that appears in the client UI (e.g., "Sleep better, recover faster")

alter table public.modules
add column if not exists headline text;

-- Backfill existing modules with headlines
update public.modules
set headline = case
    when id = 'mod_sleep' then 'Sleep better, recover faster'
    when id = 'mod_morning_routine' then 'Start your day right'
    when id = 'mod_focus_productivity' then 'Deep work, minimal distractions'
    when id = 'mod_stress_regulation' then 'Calm mind, strong body'
    when id = 'mod_energy_recovery' then 'Sustained energy, rapid recovery'
    when id = 'mod_dopamine_hygiene' then 'Restore your attention span'
    else 'Optimize your health'
end
where headline is null;
