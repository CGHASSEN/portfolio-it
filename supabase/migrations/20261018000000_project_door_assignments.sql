alter table public.projects
  add column if not exists door_ids text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_door_ids_valid'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_door_ids_valid
      check (
        door_ids <@ array[
          'contact',
          'certifications',
          'cybersecurity',
          'network',
          'server',
          'virtualization',
          'projects'
        ]::text[]
      );
  end if;
end;
$$;
