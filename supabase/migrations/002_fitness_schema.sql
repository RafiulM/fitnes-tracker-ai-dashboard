-- Fitness Tracker schema aligning with documentation

create extension if not exists "uuid-ossp";

create table if not exists public.weights (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  weight numeric(6,2) not null,
  unit text not null default 'lbs',
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_fat (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  percentage numeric(5,2) not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  activity text not null,
  sets integer,
  reps integer,
  load numeric(6,2),
  distance numeric(6,2),
  duration_minutes numeric(5,2),
  intensity text,
  performed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  description text not null,
  calories integer,
  protein_g numeric(6,2),
  carbs_g numeric(6,2),
  fats_g numeric(6,2),
  eaten_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  plan_type text not null check (plan_type in ('workout','diet')),
  title text not null,
  focus text,
  summary text,
  content jsonb not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id text unique not null,
  target_weight numeric(6,2),
  weight_unit text not null default 'lbs',
  dietary_preference text,
  theme_preference text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_weights_updated
before update on public.weights
for each row execute procedure public.set_updated_at();

create trigger trg_body_fat_updated
before update on public.body_fat
for each row execute procedure public.set_updated_at();

create trigger trg_workouts_updated
before update on public.workouts
for each row execute procedure public.set_updated_at();

create trigger trg_meals_updated
before update on public.meals
for each row execute procedure public.set_updated_at();

create trigger trg_plans_updated
before update on public.plans
for each row execute procedure public.set_updated_at();

create trigger trg_profiles_updated
before update on public.profiles
for each row execute procedure public.set_updated_at();

create index if not exists idx_weights_user_recorded_at on public.weights (user_id, recorded_at desc);
create index if not exists idx_body_fat_user_recorded_at on public.body_fat (user_id, recorded_at desc);
create index if not exists idx_workouts_user_performed_at on public.workouts (user_id, performed_at desc);
create index if not exists idx_meals_user_eaten_at on public.meals (user_id, eaten_at desc);
create index if not exists idx_plans_user_generated_at on public.plans (user_id, generated_at desc);

alter table public.weights enable row level security;
alter table public.body_fat enable row level security;
alter table public.workouts enable row level security;
alter table public.meals enable row level security;
alter table public.plans enable row level security;
alter table public.profiles enable row level security;

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.weights to authenticated;
grant select, insert, update, delete on public.body_fat to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

create policy "weights_access" on public.weights
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "body_fat_access" on public.body_fat
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workouts_access" on public.workouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meals_access" on public.meals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plans_access" on public.plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_access" on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
