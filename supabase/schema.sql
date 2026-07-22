-- GoFlazz Production Database Schema Migration
-- Self-Custody Crypto Wallet Database Architecture

create extension if not exists "pgcrypto";

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ========================================================
-- 1. PROFILES
-- ========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text,
  email text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();


-- ========================================================
-- 2. USER WALLETS
-- ========================================================
create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null unique,
  encrypted_mnemonic text,
  encrypted_private_key text not null,
  is_primary boolean not null default false,
  network text not null default 'arbitrum',
  chain_type text not null default 'evm',
  wallet_type text not null default 'hd_mnemonic',
  derivation_path text default 'm/44''/60''/0''/0/0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_wallets enable row level security;
create policy "user_wallets_select_own" on public.user_wallets for select using (auth.uid() = user_id);
create policy "user_wallets_insert_own" on public.user_wallets for insert with check (auth.uid() = user_id);
create policy "user_wallets_update_own" on public.user_wallets for update using (auth.uid() = user_id);
create policy "user_wallets_delete_own" on public.user_wallets for delete using (auth.uid() = user_id);

create trigger user_wallets_updated_at before update on public.user_wallets
  for each row execute function public.set_updated_at();


-- ========================================================
-- 3. WALLET SECURITY & SETTINGS
-- ========================================================
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


create table if not exists public.wallet_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  biometrics_enabled boolean not null default true,
  passcode_enabled boolean not null default true,
  auto_lock_minutes int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.wallet_settings enable row level security;
create policy "wallet_settings_select_own" on public.wallet_settings for select using (auth.uid() = user_id);
create policy "wallet_settings_insert_own" on public.wallet_settings for insert with check (auth.uid() = user_id);
create policy "wallet_settings_update_own" on public.wallet_settings for update using (auth.uid() = user_id);

create trigger wallet_settings_updated_at before update on public.wallet_settings
  for each row execute function public.set_updated_at();


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
create policy "security_settings_select_own" on public.security_settings for select using (auth.uid() = user_id);
create policy "security_settings_insert_own" on public.security_settings for insert with check (auth.uid() = user_id);
create policy "security_settings_update_own" on public.security_settings for update using (auth.uid() = user_id);

create trigger security_settings_updated_at before update on public.security_settings
  for each row execute function public.set_updated_at();


-- ========================================================
-- 4. WALLET CONTACTS (ADDRESS BOOK)
-- ========================================================
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
create policy "wallet_contacts_select_own" on public.wallet_contacts for select using (auth.uid() = user_id);
create policy "wallet_contacts_insert_own" on public.wallet_contacts for insert with check (auth.uid() = user_id);
create policy "wallet_contacts_update_own" on public.wallet_contacts for update using (auth.uid() = user_id);
create policy "wallet_contacts_delete_own" on public.wallet_contacts for delete using (auth.uid() = user_id);

create trigger wallet_contacts_updated_at before update on public.wallet_contacts
  for each row execute function public.set_updated_at();


-- ========================================================
-- 5. WALLET BALANCES
-- ========================================================
create table if not exists public.wallet_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.user_wallets(id) on delete cascade,
  asset_symbol text not null,
  balance numeric not null default 0,
  token_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_id, asset_symbol)
);

alter table public.wallet_balances enable row level security;
create policy "wallet_balances_select_own" on public.wallet_balances for select using (auth.uid() = user_id);
create policy "wallet_balances_insert_own" on public.wallet_balances for insert with check (auth.uid() = user_id);
create policy "wallet_balances_update_own" on public.wallet_balances for update using (auth.uid() = user_id);
create policy "wallet_balances_delete_own" on public.wallet_balances for delete using (auth.uid() = user_id);

create trigger wallet_balances_updated_at before update on public.wallet_balances
  for each row execute function public.set_updated_at();


-- ========================================================
-- 6. WALLET ACTIVITY & LOGS
-- ========================================================
create table if not exists public.wallet_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.user_wallets(id) on delete set null,
  action text not null,
  type text,
  amount numeric,
  symbol text,
  counterparty text,
  status text default 'completed',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_activity enable row level security;
create policy "wallet_activity_select_own" on public.wallet_activity for select using (auth.uid() = user_id);
create policy "wallet_activity_insert_own" on public.wallet_activity for insert with check (auth.uid() = user_id);

create trigger wallet_activity_updated_at before update on public.wallet_activity
  for each row execute function public.set_updated_at();


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


-- ========================================================
-- 7. WALLET PREFERENCES & USER PREFERENCES
-- ========================================================
create table if not exists public.wallet_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  active_wallet_id uuid references public.user_wallets(id) on delete set null,
  active_network text not null default 'arbitrum',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.wallet_preferences enable row level security;
create policy "wallet_preferences_select_own" on public.wallet_preferences for select using (auth.uid() = user_id);
create policy "wallet_preferences_insert_own" on public.wallet_preferences for insert with check (auth.uid() = user_id);
create policy "wallet_preferences_update_own" on public.wallet_preferences for update using (auth.uid() = user_id);

create trigger wallet_preferences_updated_at before update on public.wallet_preferences
  for each row execute function public.set_updated_at();


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
create policy "user_preferences_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "user_preferences_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "user_preferences_update_own" on public.user_preferences for update using (auth.uid() = user_id);

create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();


-- ========================================================
-- 8. WALLET NOTIFICATIONS & SETTINGS
-- ========================================================
create table if not exists public.wallet_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.wallet_notifications enable row level security;
create policy "wallet_notifications_select_own" on public.wallet_notifications for select using (auth.uid() = user_id);
create policy "wallet_notifications_insert_own" on public.wallet_notifications for insert with check (auth.uid() = user_id);
create policy "wallet_notifications_update_own" on public.wallet_notifications for update using (auth.uid() = user_id);

create trigger wallet_notifications_updated_at before update on public.wallet_notifications
  for each row execute function public.set_updated_at();


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
create policy "notification_settings_select_own" on public.notification_settings for select using (auth.uid() = user_id);
create policy "notification_settings_insert_own" on public.notification_settings for insert with check (auth.uid() = user_id);
create policy "notification_settings_update_own" on public.notification_settings for update using (auth.uid() = user_id);

create trigger notification_settings_updated_at before update on public.notification_settings
  for each row execute function public.set_updated_at();


-- ========================================================
-- 9. WALLET DEVICES
-- ========================================================
create table if not exists public.wallet_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null,
  device_type text,
  ip_address text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_devices enable row level security;
create policy "wallet_devices_select_own" on public.wallet_devices for select using (auth.uid() = user_id);
create policy "wallet_devices_insert_own" on public.wallet_devices for insert with check (auth.uid() = user_id);
create policy "wallet_devices_update_own" on public.wallet_devices for update using (auth.uid() = user_id);
create policy "wallet_devices_delete_own" on public.wallet_devices for delete using (auth.uid() = user_id);

create trigger wallet_devices_updated_at before update on public.wallet_devices
  for each row execute function public.set_updated_at();


-- ========================================================
-- 10. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ========================================================
create index if not exists idx_user_wallets_user_id on public.user_wallets(user_id);
create index if not exists idx_user_wallets_address on public.user_wallets(address);
create index if not exists idx_user_wallets_lower_address on public.user_wallets(lower(address));
create index if not exists idx_wallet_contacts_user_id on public.wallet_contacts(user_id);
create index if not exists idx_wallet_balances_wallet_id on public.wallet_balances(wallet_id);
create index if not exists idx_wallet_activity_user_id on public.wallet_activity(user_id);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);


-- ========================================================
-- 11. AUTOMATIC NEW USER INITIALIZATION TRIGGER
-- ========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Profiles
  insert into public.profiles (id, display_name, email, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', substring(new.email from '^[^@]+')),
    new.email,
    false
  ) on conflict (id) do nothing;

  -- Preferences
  insert into public.user_preferences (user_id, currency, language, theme)
  values (new.id, 'USD', 'en', 'dark')
  on conflict (user_id) do nothing;

  insert into public.wallet_preferences (user_id, active_network)
  values (new.id, 'arbitrum')
  on conflict (user_id) do nothing;

  -- Settings
  insert into public.security_settings (user_id, biometrics_enabled, passcode_enabled, auto_lock_minutes)
  values (new.id, true, true, 1)
  on conflict (user_id) do nothing;

  insert into public.wallet_settings (user_id, biometrics_enabled, passcode_enabled, auto_lock_minutes)
  values (new.id, true, true, 1)
  on conflict (user_id) do nothing;

  -- Notifications
  insert into public.notification_settings (user_id, push_enabled, email_enabled)
  values (new.id, true, false)
  on conflict (user_id) do nothing;

  insert into public.wallet_notifications (user_id, push_enabled, email_enabled)
  values (new.id, true, false)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ========================================================
-- 12. FOREIGN KEY REPAIR MIGRATION
-- Ensures all user_id columns reference auth.users(id) ON DELETE CASCADE
-- drops legacy profiles(id) references without data loss
-- ========================================================
do $$
declare
  tbl text;
  fk_record record;
begin
  for tbl in select unnest(array[
    'user_wallets',
    'wallets',
    'wallet_profiles',
    'profiles',
    'wallet_security',
    'wallet_settings',
    'security_settings',
    'wallet_contacts',
    'wallet_balances',
    'wallet_activity',
    'activity_logs',
    'wallet_preferences',
    'user_preferences',
    'wallet_notifications',
    'notification_settings',
    'wallet_devices'
  ]) loop

    if exists (
      select 1 from information_schema.tables 
      where table_schema = 'public' and table_name = tbl
    ) then

      for fk_record in (
        select con.conname
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace nsp on nsp.oid = rel.relnamespace
        join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
        where nsp.nspname = 'public'
          and rel.relname = tbl
          and att.attname = 'user_id'
          and con.contype = 'f'
      ) loop
        execute format('alter table public.%I drop constraint if exists %I;', tbl, fk_record.conname);
      end loop;

      execute format('
        alter table public.%I 
        add constraint %I 
        foreign key (user_id) 
        references auth.users(id) 
        on delete cascade;
      ', tbl, tbl || '_user_id_fkey');

    end if;

  end loop;
end;
$$;

