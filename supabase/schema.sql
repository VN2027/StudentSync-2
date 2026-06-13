-- StudentSync V1 Database Schema
-- Run this in your Supabase project's SQL Editor (Project -> SQL Editor -> New query)

-- 1. PROFILES
-- Extends auth.users with app-specific data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  year_level text,
  study_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, year_level)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'year_level');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. ASSESSMENTS
create table public.assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject text not null,
  title text not null,
  due_date date not null,
  weighting text,
  requirements text,
  created_at timestamp with time zone default now()
);

alter table public.assessments enable row level security;

create policy "Users can manage their own assessments"
  on public.assessments for all using (auth.uid() = user_id);


-- 3. STUDY TASKS
-- Tasks generated from an assessment breakdown, or added manually
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  assessment_id uuid references public.assessments on delete cascade,
  title text not null,
  scheduled_date date not null,
  estimated_minutes int default 30,
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.tasks enable row level security;

create policy "Users can manage their own tasks"
  on public.tasks for all using (auth.uid() = user_id);

create index tasks_user_date_idx on public.tasks (user_id, scheduled_date);
create index assessments_user_due_idx on public.assessments (user_id, due_date);
