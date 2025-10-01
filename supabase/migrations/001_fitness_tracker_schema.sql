-- Fitness Tracker Database Migration
-- Creates tables for weights, body fat, workouts, meals, and plans
-- Includes proper RLS policies and indexes

-- Create weights table
create table if not exists public.weights (
  id bigserial primary key,
  user_id text,
  weight numeric not null,
  unit text not null default 'lbs',
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create body_fat table
create table if not exists public.body_fat (
  id bigserial primary key,
  user_id text,
  percentage numeric not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create workouts table
create table if not exists public.workouts (
  id bigserial primary key,
  user_id text,
  type text not null,
  sets integer,
  reps integer,
  load numeric,
  performed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create meals table
create table if not exists public.meals (
  id bigserial primary key,
  user_id text,
  description text not null,
  calories integer,
  eaten_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create plans table
create table if not exists public.plans (
  id bigserial primary key,
  user_id text,
  plan_type text not null check (plan_type in ('workout', 'diet')),
  content jsonb not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Function to update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
drop trigger if exists trg_weights_updated_at on public.weights;
create trigger trg_weights_updated_at
before update on public.weights
for each row
execute function public.set_updated_at();

drop trigger if exists trg_body_fat_updated_at on public.body_fat;
create trigger trg_body_fat_updated_at
before update on public.body_fat
for each row
execute function public.set_updated_at();

drop trigger if exists trg_workouts_updated_at on public.workouts;
create trigger trg_workouts_updated_at
before update on public.workouts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_meals_updated_at on public.meals;
create trigger trg_meals_updated_at
before update on public.meals
for each row
execute function public.set_updated_at();

drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at
before update on public.plans
for each row
execute function public.set_updated_at();

-- Create indexes for performance
create index if not exists idx_weights_user_recorded_at on public.weights (user_id, recorded_at desc);
create index if not exists idx_body_fat_user_recorded_at on public.body_fat (user_id, recorded_at desc);
create index if not exists idx_workouts_user_performed_at on public.workouts (user_id, performed_at desc);
create index if not exists idx_meals_user_eaten_at on public.meals (user_id, eaten_at desc);
create index if not exists idx_plans_user_generated_at on public.plans (user_id, generated_at desc);

-- Enable Row Level Security
alter table public.weights enable row level security;
alter table public.body_fat enable row level security;
alter table public.workouts enable row level security;
alter table public.meals enable row level security;
alter table public.plans enable row level security;

-- Grant permissions to authenticated users
grant select, insert, update, delete on public.weights to authenticated;
grant select, insert, update, delete on public.body_fat to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.plans to authenticated;

-- RLS Policies for weights
create policy "weights_select_own_sub" on public.weights
for select to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "weights_insert_own_sub" on public.weights
for insert to authenticated
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "weights_update_own_sub" on public.weights
for update to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text))
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "weights_delete_own_sub" on public.weights
for delete to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

-- RLS Policies for body_fat
create policy "body_fat_select_own_sub" on public.body_fat
for select to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "body_fat_insert_own_sub" on public.body_fat
for insert to authenticated
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "body_fat_update_own_sub" on public.body_fat
for update to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text))
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "body_fat_delete_own_sub" on public.body_fat
for delete to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

-- RLS Policies for workouts
create policy "workouts_select_own_sub" on public.workouts
for select to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "workouts_insert_own_sub" on public.workouts
for insert to authenticated
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "workouts_update_own_sub" on public.workouts
for update to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text))
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "workouts_delete_own_sub" on public.workouts
for delete to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

-- RLS Policies for meals
create policy "meals_select_own_sub" on public.meals
for select to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "meals_insert_own_sub" on public.meals
for insert to authenticated
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "meals_update_own_sub" on public.meals
for update to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text))
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "meals_delete_own_sub" on public.meals
for delete to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

-- RLS Policies for plans
create policy "plans_select_own_sub" on public.plans
for select to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "plans_insert_own_sub" on public.plans
for insert to authenticated
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "plans_update_own_sub" on public.plans
for update to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text))
with check (((select auth.jwt() ->> 'sub') = (user_id)::text));

create policy "plans_delete_own_sub" on public.plans
for delete to authenticated
using (((select auth.jwt() ->> 'sub') = (user_id)::text));