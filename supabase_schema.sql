create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'official' check (role in ('official','admin','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  official_name text,
  event_name text,
  stage_name text,
  event_date date,
  location text,
  tag_id text,
  rider_name text,
  bib_number text,
  team_name text,
  bike_brand text,
  frame_model text,
  frame_serial text,
  wheels text,
  groupset text,
  transponder_id text,
  status text,
  overall_result text not null check (overall_result in ('PASS','WARNING','FAIL')),
  notes text,
  photo_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.inspection_checks (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  check_code text not null,
  check_label text,
  result text not null check (result in ('PASS','WARNING','FAIL','SKIP')),
  comment text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'official'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_checks enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "inspections_select_own_or_admin" on public.inspections;
drop policy if exists "inspections_insert_own" on public.inspections;
drop policy if exists "inspections_update_own_or_admin" on public.inspections;
drop policy if exists "checks_select_own_or_admin" on public.inspection_checks;
drop policy if exists "checks_insert_own" on public.inspection_checks;
drop policy if exists "checks_update_own_or_admin" on public.inspection_checks;

create policy "profiles_select_own_or_admin" on public.profiles for select to authenticated using (
  auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "inspections_select_own_or_admin" on public.inspections for select to authenticated using (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "inspections_insert_own" on public.inspections for insert to authenticated with check (auth.uid() = user_id);
create policy "inspections_update_own_or_admin" on public.inspections for update to authenticated using (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "checks_select_own_or_admin" on public.inspection_checks for select to authenticated using (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "checks_insert_own" on public.inspection_checks for insert to authenticated with check (auth.uid() = user_id);
create policy "checks_update_own_or_admin" on public.inspection_checks for update to authenticated using (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false)
on conflict (id) do nothing;

drop policy if exists "inspection_photos_insert_own" on storage.objects;
drop policy if exists "inspection_photos_read_own_or_admin" on storage.objects;

create policy "inspection_photos_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'inspection-photos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "inspection_photos_read_own_or_admin" on storage.objects for select to authenticated using (
  bucket_id = 'inspection-photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);

-- promote first admin manually:
-- update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
