-- GoFlazz Enterprise Security & Advanced Infrastructure V4 Migration
-- Production-Ready PostgreSQL & Supabase Schema Extension

-- ========================================================
-- 1. RECOVERY GUARDIAN SYSTEM
-- ========================================================

create table if not exists public.recovery_guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guardian_user_id uuid references auth.users(id) on delete set null,
  guardian_name text not null,
  guardian_email text,
  guardian_address text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'revoked')),
  invitation_token text unique,
  cooldown_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recovery_guardians enable row level security;
create policy "recovery_guardians_select_own" on public.recovery_guardians for select using (auth.uid() = user_id or auth.uid() = guardian_user_id);
create policy "recovery_guardians_insert_own" on public.recovery_guardians for insert with check (auth.uid() = user_id);
create policy "recovery_guardians_update_own" on public.recovery_guardians for update using (auth.uid() = user_id or auth.uid() = guardian_user_id);
create policy "recovery_guardians_delete_own" on public.recovery_guardians for delete using (auth.uid() = user_id);

create index if not exists idx_recovery_guardians_user_id on public.recovery_guardians(user_id);
create index if not exists idx_recovery_guardians_guardian_user_id on public.recovery_guardians(guardian_user_id);
create index if not exists idx_recovery_guardians_status on public.recovery_guardians(status);

create trigger recovery_guardians_updated_at before update on public.recovery_guardians
  for each row execute function public.set_updated_at();


create table if not exists public.guardian_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  new_wallet_address text not null,
  threshold int not null default 2,
  total_guardians int not null default 3,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guardian_requests enable row level security;
create policy "guardian_requests_select_own" on public.guardian_requests for select using (auth.uid() = user_id);
create policy "guardian_requests_insert_own" on public.guardian_requests for insert with check (auth.uid() = user_id);
create policy "guardian_requests_update_own" on public.guardian_requests for update using (auth.uid() = user_id);

create index if not exists idx_guardian_requests_user_id on public.guardian_requests(user_id);
create index if not exists idx_guardian_requests_status on public.guardian_requests(status);

create trigger guardian_requests_updated_at before update on public.guardian_requests
  for each row execute function public.set_updated_at();


create table if not exists public.guardian_votes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.guardian_requests(id) on delete cascade,
  guardian_id uuid not null references public.recovery_guardians(id) on delete cascade,
  vote text not null check (vote in ('approve', 'reject')),
  signature text not null,
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id, guardian_id)
);

alter table public.guardian_votes enable row level security;
create policy "guardian_votes_select_own" on public.guardian_votes for select using (true);
create policy "guardian_votes_insert_own" on public.guardian_votes for insert with check (true);

create index if not exists idx_guardian_votes_request_id on public.guardian_votes(request_id);
create index if not exists idx_guardian_votes_guardian_id on public.guardian_votes(guardian_id);


-- ========================================================
-- 2. PASSKEY INFRASTRUCTURE (WEBAUTHN)
-- ========================================================

create table if not exists public.passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  transports text[] default array[]::text[],
  sign_count bigint not null default 0,
  authenticator_type text not null default 'platform',
  backup_eligible boolean not null default false,
  backup_status boolean not null default false,
  device_name text,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.passkeys enable row level security;
create policy "passkeys_select_own" on public.passkeys for select using (auth.uid() = user_id);
create policy "passkeys_insert_own" on public.passkeys for insert with check (auth.uid() = user_id);
create policy "passkeys_update_own" on public.passkeys for update using (auth.uid() = user_id);
create policy "passkeys_delete_own" on public.passkeys for delete using (auth.uid() = user_id);

create index if not exists idx_passkeys_user_id on public.passkeys(user_id);
create index if not exists idx_passkeys_credential_id on public.passkeys(credential_id);

create trigger passkeys_updated_at before update on public.passkeys
  for each row execute function public.set_updated_at();


create table if not exists public.passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.passkey_challenges enable row level security;
create policy "passkey_challenges_select_own" on public.passkey_challenges for select using (auth.uid() = user_id);
create policy "passkey_challenges_insert_own" on public.passkey_challenges for insert with check (auth.uid() = user_id);

create index if not exists idx_passkey_challenges_user_id on public.passkey_challenges(user_id);


-- ========================================================
-- 3. EMERGENCY LOCKDOWN
-- ========================================================

create table if not exists public.emergency_lockdowns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  is_locked boolean not null default false,
  freeze_account boolean not null default true,
  disable_exports boolean not null default true,
  disable_transfers boolean not null default true,
  disable_swaps boolean not null default true,
  disable_bridge boolean not null default true,
  disable_trade boolean not null default true,
  disable_staking boolean not null default true,
  lock_reason text,
  triggered_by text not null default 'user' check (triggered_by in ('user', 'ai_risk_engine', 'guardian', 'admin')),
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.emergency_lockdowns enable row level security;
create policy "emergency_lockdowns_select_own" on public.emergency_lockdowns for select using (auth.uid() = user_id);
create policy "emergency_lockdowns_insert_own" on public.emergency_lockdowns for insert with check (auth.uid() = user_id);
create policy "emergency_lockdowns_update_own" on public.emergency_lockdowns for update using (auth.uid() = user_id);

create index if not exists idx_emergency_lockdowns_user_id on public.emergency_lockdowns(user_id);
create index if not exists idx_emergency_lockdowns_is_locked on public.emergency_lockdowns(is_locked);

create trigger emergency_lockdowns_updated_at before update on public.emergency_lockdowns
  for each row execute function public.set_updated_at();


-- ========================================================
-- 4. AML & COMPLIANCE MONITORING
-- ========================================================

create table if not exists public.sanctions_cache (
  id uuid primary key default gen_random_uuid(),
  address text not null unique,
  chain text not null default 'all',
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'critical', 'sanctioned')),
  source text not null default 'ofac',
  reason text,
  raw_data jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sanctions_cache enable row level security;
create policy "sanctions_cache_select_all" on public.sanctions_cache for select using (true);

create index if not exists idx_sanctions_cache_address on public.sanctions_cache(address);
create index if not exists idx_sanctions_cache_risk_level on public.sanctions_cache(risk_level);


create table if not exists public.aml_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  flag_type text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  details jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.aml_flags enable row level security;
create policy "aml_flags_select_own" on public.aml_flags for select using (auth.uid() = user_id);
create policy "aml_flags_insert_own" on public.aml_flags for insert with check (auth.uid() = user_id);

create index if not exists idx_aml_flags_user_id on public.aml_flags(user_id);
create index if not exists idx_aml_flags_wallet_address on public.aml_flags(wallet_address);


create table if not exists public.aml_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  overall_score integer not null default 0,
  mixer_exposure boolean not null default false,
  sanction_exposure boolean not null default false,
  darknet_exposure boolean not null default false,
  risk_tier text not null default 'low' check (risk_tier in ('low', 'medium', 'high', 'severe')),
  updated_at timestamptz not null default now(),
  unique (user_id, wallet_address)
);

alter table public.aml_scores enable row level security;
create policy "aml_scores_select_own" on public.aml_scores for select using (auth.uid() = user_id);
create policy "aml_scores_insert_own" on public.aml_scores for insert with check (auth.uid() = user_id);
create policy "aml_scores_update_own" on public.aml_scores for update using (auth.uid() = user_id);

create index if not exists idx_aml_scores_user_id on public.aml_scores(user_id);


-- ========================================================
-- 5. SMART CONTRACT ALLOWLIST & BLACKLIST
-- ========================================================

create table if not exists public.contract_allowlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_address text not null,
  chain text not null default 'arbitrum',
  protocol_name text not null,
  verified boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, contract_address, chain)
);

alter table public.contract_allowlist enable row level security;
create policy "contract_allowlist_select_own" on public.contract_allowlist for select using (auth.uid() = user_id);
create policy "contract_allowlist_insert_own" on public.contract_allowlist for insert with check (auth.uid() = user_id);
create policy "contract_allowlist_delete_own" on public.contract_allowlist for delete using (auth.uid() = user_id);

create index if not exists idx_contract_allowlist_user_id on public.contract_allowlist(user_id);


create table if not exists public.contract_blacklist (
  id uuid primary key default gen_random_uuid(),
  contract_address text not null,
  chain text not null default 'all',
  reason text not null,
  risk_score integer not null default 100,
  audit_source text,
  category text not null default 'scam',
  created_at timestamptz not null default now(),
  unique (contract_address, chain)
);

alter table public.contract_blacklist enable row level security;
create policy "contract_blacklist_select_all" on public.contract_blacklist for select using (true);

create index if not exists idx_contract_blacklist_contract_address on public.contract_blacklist(contract_address);


-- ========================================================
-- 6. TRANSACTION RISK ENGINE
-- ========================================================

create table if not exists public.transaction_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  recipient_address text not null,
  amount_usd numeric not null default 0,
  risk_score integer not null default 0,
  risk_factors jsonb not null default '[]'::jsonb,
  action_recommended text not null default 'approve' check (action_recommended in ('approve', 'warn', 'block')),
  created_at timestamptz not null default now()
);

alter table public.transaction_risk_assessments enable row level security;
create policy "tx_risk_select_own" on public.transaction_risk_assessments for select using (auth.uid() = user_id);
create policy "tx_risk_insert_own" on public.transaction_risk_assessments for insert with check (auth.uid() = user_id);

create index if not exists idx_tx_risk_user_id on public.transaction_risk_assessments(user_id);
create index if not exists idx_tx_risk_created_at on public.transaction_risk_assessments(created_at);


-- ========================================================
-- 7. NOTIFICATION QUEUE
-- ========================================================

create table if not exists public.push_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.wallet_devices(id) on delete cascade,
  title text not null,
  body text not null,
  payload jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'dead')),
  attempts int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_queue enable row level security;
create policy "push_queue_select_own" on public.push_queue for select using (auth.uid() = user_id);
create policy "push_queue_insert_own" on public.push_queue for insert with check (auth.uid() = user_id);

create index if not exists idx_push_queue_user_id on public.push_queue(user_id);
create index if not exists idx_push_queue_status on public.push_queue(status);

create trigger push_queue_updated_at before update on public.push_queue
  for each row execute function public.set_updated_at();


create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  html_body text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'dead')),
  attempts int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_queue enable row level security;
create policy "email_queue_select_own" on public.email_queue for select using (auth.uid() = user_id);
create policy "email_queue_insert_own" on public.email_queue for insert with check (auth.uid() = user_id);

create index if not exists idx_email_queue_user_id on public.email_queue(user_id);
create index if not exists idx_email_queue_status on public.email_queue(status);

create trigger email_queue_updated_at before update on public.email_queue
  for each row execute function public.set_updated_at();


create table if not exists public.sms_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_number text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'dead')),
  attempts int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sms_queue enable row level security;
create policy "sms_queue_select_own" on public.sms_queue for select using (auth.uid() = user_id);
create policy "sms_queue_insert_own" on public.sms_queue for insert with check (auth.uid() = user_id);

create index if not exists idx_sms_queue_user_id on public.sms_queue(user_id);
create index if not exists idx_sms_queue_status on public.sms_queue(status);

create trigger sms_queue_updated_at before update on public.sms_queue
  for each row execute function public.set_updated_at();


-- ========================================================
-- 8. WALLET ANALYTICS & METRICS
-- ========================================================

create table if not exists public.wallet_statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_volume_usd numeric not null default 0,
  swap_volume_usd numeric not null default 0,
  bridge_volume_usd numeric not null default 0,
  trade_volume_usd numeric not null default 0,
  nft_volume_usd numeric not null default 0,
  total_profit_loss_usd numeric not null default 0,
  average_gas_spent numeric not null default 0,
  favorite_chain text default 'arbitrum',
  favorite_token text default 'USDC',
  daily_active_days int not null default 1,
  monthly_active_days int not null default 1,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.wallet_statistics enable row level security;
create policy "wallet_stats_select_own" on public.wallet_statistics for select using (auth.uid() = user_id);
create policy "wallet_stats_insert_own" on public.wallet_statistics for insert with check (auth.uid() = user_id);
create policy "wallet_stats_update_own" on public.wallet_statistics for update using (auth.uid() = user_id);

create index if not exists idx_wallet_stats_user_id on public.wallet_statistics(user_id);

create trigger wallet_statistics_updated_at before update on public.wallet_statistics
  for each row execute function public.set_updated_at();


-- ========================================================
-- 9. REFERRAL INFRASTRUCTURE
-- ========================================================

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  campaign text not null default 'default',
  total_referred int not null default 0,
  total_earned_usd numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.referral_codes enable row level security;
create policy "referral_codes_select_all" on public.referral_codes for select using (true);
create policy "referral_codes_insert_own" on public.referral_codes for insert with check (auth.uid() = user_id);
create policy "referral_codes_update_own" on public.referral_codes for update using (auth.uid() = user_id);

create index if not exists idx_referral_codes_code on public.referral_codes(code);


create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null references auth.users(id) on delete cascade,
  reward_amount numeric not null default 0,
  reward_token text not null default 'USDC',
  status text not null default 'pending' check (status in ('pending', 'paid', 'revoked')),
  created_at timestamptz not null default now()
);

alter table public.referral_rewards enable row level security;
create policy "referral_rewards_select_own" on public.referral_rewards for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

create index if not exists idx_referral_rewards_referrer on public.referral_rewards(referrer_id);


-- ========================================================
-- 10. FEATURE FLAGS & A/B TESTING
-- ========================================================

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_enabled boolean not null default false,
  rollout_percentage int not null default 0 check (rollout_percentage between 0 and 100),
  target_audience text not null default 'all' check (target_audience in ('all', 'internal_alpha', 'closed_beta', 'open_beta', 'production')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;
create policy "feature_flags_select_all" on public.feature_flags for select using (true);

create trigger feature_flags_updated_at before update on public.feature_flags
  for each row execute function public.set_updated_at();


create table if not exists public.ab_tests (
  id uuid primary key default gen_random_uuid(),
  experiment_key text not null unique,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'concluded')),
  created_at timestamptz not null default now()
);

alter table public.ab_tests enable row level security;
create policy "ab_tests_select_all" on public.ab_tests for select using (true);


create table if not exists public.ab_assignments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.ab_tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant text not null,
  created_at timestamptz not null default now(),
  unique (test_id, user_id)
);

alter table public.ab_assignments enable row level security;
create policy "ab_assignments_select_own" on public.ab_assignments for select using (auth.uid() = user_id);
create policy "ab_assignments_insert_own" on public.ab_assignments for insert with check (auth.uid() = user_id);

create index if not exists idx_ab_assignments_user_id on public.ab_assignments(user_id);


-- ========================================================
-- 11. ENTERPRISE BACKUP VERIFICATION & HEALTH MONITORING
-- ========================================================

create table if not exists public.backup_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.user_wallets(id) on delete cascade,
  checksum text not null,
  verification_passed boolean not null default false,
  tested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.backup_verifications enable row level security;
create policy "backup_verifications_select_own" on public.backup_verifications for select using (auth.uid() = user_id);
create policy "backup_verifications_insert_own" on public.backup_verifications for insert with check (auth.uid() = user_id);

create index if not exists idx_backup_verifications_user_id on public.backup_verifications(user_id);
create index if not exists idx_backup_verifications_wallet_id on public.backup_verifications(wallet_id);


create table if not exists public.database_health (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'healthy',
  active_connections int,
  slow_queries_count int default 0,
  storage_usage_mb numeric,
  checked_at timestamptz not null default now()
);

alter table public.database_health enable row level security;
create policy "db_health_select_all" on public.database_health for select using (true);


create table if not exists public.job_history (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null check (status in ('success', 'failed', 'running')),
  duration_ms bigint,
  error_message text,
  executed_at timestamptz not null default now()
);

alter table public.job_health enable row level security;
create policy "job_history_select_all" on public.job_history for select using (true);

create index if not exists idx_job_history_job_name on public.job_history(job_name);
create index if not exists idx_job_history_executed_at on public.job_history(executed_at);

-- ========================================================
-- END OF ADVANCED ENTERPRISE MIGRATION
-- ========================================================
