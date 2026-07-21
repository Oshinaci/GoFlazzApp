-- GoFlazz Database Schema
-- Paste into Supabase SQL Editor or run via CLI to apply.

create extension if not exists "pgcrypto";

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  onboarding_status text not null default 'incomplete', -- 'incomplete', 'completed'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============ user_preferences ============
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'USD',
  language text not null default 'en',
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.user_preferences enable row level security;
create policy "preferences_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "preferences_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "preferences_update_own" on public.user_preferences for update using (auth.uid() = user_id);

create trigger preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ============ security_settings ============
create table if not exists public.security_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  biometrics_enabled boolean not null default true,
  passcode_enabled boolean not null default true,
  auto_lock_minutes int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.security_settings enable row level security;
create policy "security_select_own" on public.security_settings for select using (auth.uid() = user_id);
create policy "security_insert_own" on public.security_settings for insert with check (auth.uid() = user_id);
create policy "security_update_own" on public.security_settings for update using (auth.uid() = user_id);

create trigger security_updated_at before update on public.security_settings
  for each row execute function public.set_updated_at();

-- ============ notification_settings ============
create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.notification_settings enable row level security;
create policy "notifications_select_own" on public.notification_settings for select using (auth.uid() = user_id);
create policy "notifications_insert_own" on public.notification_settings for insert with check (auth.uid() = user_id);
create policy "notifications_update_own" on public.notification_settings for update using (auth.uid() = user_id);

create trigger notifications_updated_at before update on public.notification_settings
  for each row execute function public.set_updated_at();

-- ============ activity_logs ============
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;
create policy "activity_logs_select_own" on public.activity_logs for select using (auth.uid() = user_id);
create policy "activity_logs_insert_own" on public.activity_logs for insert with check (auth.uid() = user_id);

create trigger activity_logs_updated_at before update on public.activity_logs
  for each row execute function public.set_updated_at();


-- ============ AUTOMATIC REGISTRATION TRIGGER ============
-- This trigger automatically creates profiles, user_preferences, security_settings,
-- and notification_settings in public schema when a new user registers in auth.users.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name, email, onboarding_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', substring(new.email from '^[^@]+')),
    new.email,
    'incomplete'
  ) on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id, currency, language, theme)
  values (new.id, 'USD', 'en', 'dark')
  on conflict (user_id) do nothing;

  insert into public.security_settings (user_id, biometrics_enabled, passcode_enabled, auto_lock_minutes)
  values (new.id, true, true, 1)
  on conflict (user_id) do nothing;

  insert into public.notification_settings (user_id, push_enabled, email_enabled)
  values (new.id, true, false)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ wallets ============
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null unique,
  encrypted_mnemonic text,
  encrypted_private_key text not null,
  is_primary boolean not null default false,
  network text not null default 'arbitrum',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallets enable row level security;
create policy "wallets_select_own" on public.wallets for select using (auth.uid() = user_id);
create policy "wallets_insert_own" on public.wallets for insert with check (auth.uid() = user_id);
create policy "wallets_update_own" on public.wallets for update using (auth.uid() = user_id);
create policy "wallets_delete_own" on public.wallets for delete using (auth.uid() = user_id);

create trigger wallets_updated_at before update on public.wallets
  for each row execute function public.set_updated_at();

-- ============ wallet_metadata ============
create table if not exists public.wallet_metadata (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  meta_key text not null,
  meta_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_id, meta_key)
);

alter table public.wallet_metadata enable row level security;
create policy "metadata_select_own" on public.wallet_metadata for select using (
  exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid())
);
create policy "metadata_insert_own" on public.wallet_metadata for insert with check (
  exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid())
);
create policy "metadata_update_own" on public.wallet_metadata for update using (
  exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid())
);
create policy "metadata_delete_own" on public.wallet_metadata for delete using (
  exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid())
);

create trigger wallet_metadata_updated_at before update on public.wallet_metadata
  for each row execute function public.set_updated_at();

-- ============ wallet_contacts ============
create table if not exists public.wallet_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_contacts enable row level security;
create policy "contacts_select_own" on public.wallet_contacts for select using (auth.uid() = user_id);
create policy "contacts_insert_own" on public.wallet_contacts for insert with check (auth.uid() = user_id);
create policy "contacts_update_own" on public.wallet_contacts for update using (auth.uid() = user_id);
create policy "contacts_delete_own" on public.wallet_contacts for delete using (auth.uid() = user_id);

create trigger wallet_contacts_updated_at before update on public.wallet_contacts
  for each row execute function public.set_updated_at();

-- ============ wallet_security ============
create table if not exists public.wallet_security (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_hash text not null,
  pin_attempts int not null default 0,
  locked_until timestamptz,
  biometrics_supported boolean not null default false,
  biometrics_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.wallet_security enable row level security;
create policy "wallet_security_select_own" on public.wallet_security for select using (auth.uid() = user_id);
create policy "wallet_security_insert_own" on public.wallet_security for insert with check (auth.uid() = user_id);
create policy "wallet_security_update_own" on public.wallet_security for update using (auth.uid() = user_id);

create trigger wallet_security_updated_at before update on public.wallet_security
  for each row execute function public.set_updated_at();

-- ============ wallet_preferences ============
create table if not exists public.wallet_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  active_wallet_id uuid references public.wallets(id) on delete set null,
  active_network text not null default 'arbitrum',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.wallet_preferences enable row level security;
create policy "preferences_select_own_wp" on public.wallet_preferences for select using (auth.uid() = user_id);
create policy "preferences_insert_own_wp" on public.wallet_preferences for insert with check (auth.uid() = user_id);
create policy "preferences_update_own_wp" on public.wallet_preferences for update using (auth.uid() = user_id);

create trigger wallet_preferences_updated_at before update on public.wallet_preferences
  for each row execute function public.set_updated_at();

