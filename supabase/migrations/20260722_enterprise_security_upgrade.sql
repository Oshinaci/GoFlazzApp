-- GoFlazz Enterprise Security Database Upgrade (V3)
-- Architecture for Account Recovery, Device Management, Session Management, Security Center, Wallet Backup, MPC, and Social Recovery.

-- ========================================================
-- 1. SECURITY CENTER STATUS
-- ========================================================
create table if not exists public.security_center_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  security_score integer not null default 0,
  has_pin_setup boolean not null default false,
  has_backup_pdf boolean not null default false,
  has_recovery_phrase boolean not null default false,
  has_social_recovery boolean not null default false,
  has_biometrics boolean not null default false,
  two_factor_enabled boolean not null default false,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.security_center_status enable row level security;

create policy "security_center_select_own" on public.security_center_status
  for select using (auth.uid() = user_id);

create policy "security_center_insert_own" on public.security_center_status
  for insert with check (auth.uid() = user_id);

create policy "security_center_update_own" on public.security_center_status
  for update using (auth.uid() = user_id);

create trigger security_center_updated_at before update on public.security_center_status
  for each row execute function public.set_updated_at();

comment on table public.security_center_status is 'Central storage for user security health checklist and calculated score.';


-- ========================================================
-- 2. RECOVERY METHODS
-- ========================================================
create table if not exists public.recovery_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method_type text not null check (method_type in ('recovery_phrase', 'social_guardian', 'passkey', 'email_backup')),
  is_verified boolean not null default false,
  recovery_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recovery_methods enable row level security;

create policy "recovery_methods_select_own" on public.recovery_methods
  for select using (auth.uid() = user_id);

create policy "recovery_methods_insert_own" on public.recovery_methods
  for insert with check (auth.uid() = user_id);

create policy "recovery_methods_update_own" on public.recovery_methods
  for update using (auth.uid() = user_id);

create policy "recovery_methods_delete_own" on public.recovery_methods
  for delete using (auth.uid() = user_id);

create index if not exists idx_recovery_methods_user_id on public.recovery_methods(user_id);

create trigger recovery_methods_updated_at before update on public.recovery_methods
  for each row execute function public.set_updated_at();

comment on table public.recovery_methods is 'User recovery options including physical paper backup, social guardian threshold configs, or WebAuthn passkey keys.';


-- ========================================================
-- 3. SOCIAL GUARDIANS
-- ========================================================
create table if not exists public.social_guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guardian_address text not null,
  guardian_name text,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_guardians enable row level security;

create policy "social_guardians_select_own" on public.social_guardians
  for select using (auth.uid() = user_id);

create policy "social_guardians_insert_own" on public.social_guardians
  for insert with check (auth.uid() = user_id);

create policy "social_guardians_update_own" on public.social_guardians
  for update using (auth.uid() = user_id);

create policy "social_guardians_delete_own" on public.social_guardians
  for delete using (auth.uid() = user_id);

create index if not exists idx_social_guardians_user_id on public.social_guardians(user_id);
create index if not exists idx_social_guardians_guardian_address on public.social_guardians(guardian_address);

create trigger social_guardians_updated_at before update on public.social_guardians
  for each row execute function public.set_updated_at();

comment on table public.social_guardians is 'Configured third-party wallet addresses or trusted entities acting as social recovery key guardians.';


-- ========================================================
-- 4. RECOVERY REQUESTS
-- ========================================================
create table if not exists public.recovery_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  new_public_key text,
  signatures_collected jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'executed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recovery_requests enable row level security;

create policy "recovery_requests_select_own" on public.recovery_requests
  for select using (auth.uid() = user_id);

create policy "recovery_requests_insert_own" on public.recovery_requests
  for insert with check (auth.uid() = user_id);

create policy "recovery_requests_update_own" on public.recovery_requests
  for update using (auth.uid() = user_id);

create index if not exists idx_recovery_requests_user_id on public.recovery_requests(user_id);

create trigger recovery_requests_updated_at before update on public.recovery_requests
  for each row execute function public.set_updated_at();

comment on table public.recovery_requests is 'Active social recovery procedures tracking guardian cryptographic approvals and signatures.';


-- ========================================================
-- 5. USER SESSIONS
-- ========================================================
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.wallet_devices(id) on delete cascade,
  token_hash text not null,
  user_agent text,
  ip_address text,
  is_revoked boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_sessions enable row level security;

create policy "user_sessions_select_own" on public.user_sessions
  for select using (auth.uid() = user_id);

create policy "user_sessions_insert_own" on public.user_sessions
  for insert with check (auth.uid() = user_id);

create policy "user_sessions_update_own" on public.user_sessions
  for update using (auth.uid() = user_id);

create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_user_sessions_token_hash on public.user_sessions(token_hash);

create trigger user_sessions_updated_at before update on public.user_sessions
  for each row execute function public.set_updated_at();

comment on table public.user_sessions is 'Tracks active client login sessions to facilitate multi-device management and quick revoke policies.';


-- ========================================================
-- 6. WALLET BACKUPS
-- ========================================================
create table if not exists public.wallet_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.user_wallets(id) on delete cascade,
  backup_type text not null check (backup_type in ('pdf', 'cloud_encrypted', 'manual_seed')),
  backup_status text not null check (backup_status in ('completed', 'outdated')),
  last_backed_up_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_backups enable row level security;

create policy "wallet_backups_select_own" on public.wallet_backups
  for select using (auth.uid() = user_id);

create policy "wallet_backups_insert_own" on public.wallet_backups
  for insert with check (auth.uid() = user_id);

create policy "wallet_backups_update_own" on public.wallet_backups
  for update using (auth.uid() = user_id);

create policy "wallet_backups_delete_own" on public.wallet_backups
  for delete using (auth.uid() = user_id);

create index if not exists idx_wallet_backups_user_id on public.wallet_backups(user_id);
create index if not exists idx_wallet_backups_wallet_id on public.wallet_backups(wallet_id);

create trigger wallet_backups_updated_at before update on public.wallet_backups
  for each row execute function public.set_updated_at();

comment on table public.wallet_backups is 'Maintains timestamps and confirmation hashes of wallet secret phrases backed up by end users.';


-- ========================================================
-- 7. MPC KEY SHARES (MULTI-PARTY COMPUTATION)
-- ========================================================
create table if not exists public.mpc_key_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.user_wallets(id) on delete cascade,
  share_index integer not null,
  encrypted_share text not null,
  share_type text not null check (share_type in ('device', 'cloud', 'recovery')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mpc_key_shares enable row level security;

create policy "mpc_key_shares_select_own" on public.mpc_key_shares
  for select using (auth.uid() = user_id);

create policy "mpc_key_shares_insert_own" on public.mpc_key_shares
  for insert with check (auth.uid() = user_id);

create policy "mpc_key_shares_update_own" on public.mpc_key_shares
  for update using (auth.uid() = user_id);

create index if not exists idx_mpc_key_shares_user_id on public.mpc_key_shares(user_id);
create index if not exists idx_mpc_key_shares_wallet_id on public.mpc_key_shares(wallet_id);

create trigger mpc_key_shares_updated_at before update on public.mpc_key_shares
  for each row execute function public.set_updated_at();

comment on table public.mpc_key_shares is 'Encrypted threshold-decryption MPC slices supporting passwordless split signature routines.';


-- ========================================================
-- 8. SECURITY HELPER FUNCTIONS
-- ========================================================

-- Calculates and updates the user security status health metrics
create or replace function public.recalculate_security_score(p_user_id uuid)
returns integer as $$
declare
  v_score integer := 0;
  v_has_pin boolean := false;
  v_has_pdf boolean := false;
  v_has_phrase boolean := false;
  v_has_social boolean := false;
  v_has_bio boolean := false;
  v_has_2fa boolean := false;
begin
  -- 1. Check PIN setup
  select exists (
    select 1 from public.wallet_security 
    where user_id = p_user_id and pin_hash is not null
  ) into v_has_pin;

  if v_has_pin then
    v_score := v_score + 25;
  end if;

  -- 2. Check Biometrics enabled
  select exists (
    select 1 from public.wallet_security 
    where user_id = p_user_id and biometrics_enabled = true
  ) into v_has_bio;

  if v_has_bio then
    v_score := v_score + 15;
  end if;

  -- 3. Check recovery phrase setup
  select exists (
    select 1 from public.recovery_methods 
    where user_id = p_user_id and method_type = 'recovery_phrase' and is_verified = true
  ) into v_has_phrase;

  if v_has_phrase then
    v_score := v_score + 25;
  end if;

  -- 4. Check PDF backup
  select exists (
    select 1 from public.wallet_backups 
    where user_id = p_user_id and backup_type = 'pdf' and backup_status = 'completed'
  ) into v_has_pdf;

  if v_has_pdf then
    v_score := v_score + 15;
  end if;

  -- 5. Check Social Recovery guardians configured
  select exists (
    select 1 from public.social_guardians 
    where user_id = p_user_id and status = 'active'
  ) into v_has_social;

  if v_has_social then
    v_score := v_score + 20;
  end if;

  -- Insert or update state center metrics
  insert into public.security_center_status (
    user_id,
    security_score,
    has_pin_setup,
    has_backup_pdf,
    has_recovery_phrase,
    has_social_recovery,
    has_biometrics,
    two_factor_enabled,
    last_checked_at
  )
  values (
    p_user_id,
    v_score,
    v_has_pin,
    v_has_pdf,
    v_has_phrase,
    v_has_social,
    v_has_bio,
    false,
    now()
  )
  on conflict (user_id) do update set
    security_score = excluded.security_score,
    has_pin_setup = excluded.has_pin_setup,
    has_backup_pdf = excluded.has_backup_pdf,
    has_recovery_phrase = excluded.has_recovery_phrase,
    has_social_recovery = excluded.has_social_recovery,
    has_biometrics = excluded.has_biometrics,
    last_checked_at = now(),
    updated_at = now();

  return v_score;
end;
$$ language plpgsql security definer;

comment on function public.recalculate_security_score is 'Dynamic analytical query returning a security tier indicator rating for personal self-custody wallets.';


-- Create automatic trigger on user backups to keep safety score synchronized
create or replace function public.on_wallet_backup_changed()
returns trigger as $$
begin
  perform public.recalculate_security_score(new.user_id);
  return new;
end;
$$ language plpgsql;

create trigger trg_wallet_backup_sync
  after insert or update on public.wallet_backups
  for each row execute function public.on_wallet_backup_changed();
