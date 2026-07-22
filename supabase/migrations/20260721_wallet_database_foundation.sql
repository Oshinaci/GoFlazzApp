-- GoFlazz Migration: Phase 2 Step 3.1.1 - Wallet Database Foundation
-- File: /supabase/migrations/20260721_wallet_database_foundation.sql
-- Description: Safely adds multi-chain HD wallet derivation fields and case-insensitive index to public.user_wallets.

-- 1. Safely add multi-chain HD wallet metadata columns to public.user_wallets
ALTER TABLE IF EXISTS public.user_wallets
  ADD COLUMN IF NOT EXISTS chain_type TEXT NOT NULL DEFAULT 'evm',
  ADD COLUMN IF NOT EXISTS wallet_type TEXT NOT NULL DEFAULT 'hd_mnemonic',
  ADD COLUMN IF NOT EXISTS derivation_path TEXT DEFAULT 'm/44''/60''/0''/0/0';

-- 2. Create case-insensitive address index for rapid lookups and deduplication
CREATE INDEX IF NOT EXISTS idx_user_wallets_lower_address ON public.user_wallets (LOWER(address));

-- 3. Ensure Row Level Security (RLS) is enabled and policies are active
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_wallets_select_own" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_insert_own" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_update_own" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_delete_own" ON public.user_wallets;

CREATE POLICY "user_wallets_select_own" ON public.user_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_wallets_insert_own" ON public.user_wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_wallets_update_own" ON public.user_wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_wallets_delete_own" ON public.user_wallets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
