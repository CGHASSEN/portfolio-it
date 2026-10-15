create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

create policy "Admins can read their own admin membership"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portfolio_admin() from public, anon;
grant execute on function public.is_portfolio_admin() to authenticated;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '',
  objective text not null default '',
  technologies text[] not null default '{}',
  steps text[] not null default '{}',
  results text not null default '',
  cover_image_path text,
  screenshot_paths text[] not null default '{}',
  repository_url text,
  demo_url text,
  category text not null default 'PROJET IT',
  project_date date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_public_order_idx
  on public.projects (sort_order, created_at desc)
  where status = 'published';

alter table public.projects enable row level security;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

create policy "Visitors can read published projects and admins can read all"
  on public.projects for select to anon, authenticated
  using (
    status = 'published'
    or ((select auth.role()) = 'authenticated' and (select public.is_portfolio_admin()))
  );

create policy "Admins can create projects"
  on public.projects for insert to authenticated
  with check ((select public.is_portfolio_admin()));

create policy "Admins can update projects"
  on public.projects for update to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

create policy "Admins can delete projects"
  on public.projects for delete to authenticated
  using ((select public.is_portfolio_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-projects',
  'portfolio-projects',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Visitors can read published project images and admins can read all"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'portfolio-projects'
    and (
      (
        (select auth.role()) = 'authenticated'
        and (select public.is_portfolio_admin())
      )
      or exists (
        select 1
        from public.projects
        where projects.id::text = (storage.foldername(name))[1]
          and projects.status = 'published'
      )
    )
  );

create policy "Admins can upload project images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio-projects'
    and (select public.is_portfolio_admin())
  );

create policy "Admins can update project images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portfolio-projects'
    and (select public.is_portfolio_admin())
  )
  with check (
    bucket_id = 'portfolio-projects'
    and (select public.is_portfolio_admin())
  );

create policy "Admins can delete project images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio-projects'
    and (select public.is_portfolio_admin())
  );
