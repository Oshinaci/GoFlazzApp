-- GoFlazz Migration: Fix Missing onboarding_status Column & PostgREST Schema Cache Fix
-- File: /supabase/migrations/20260721_add_missing_profile_columns_and_schema_fix.sql
-- Description: Safely adds onboarding_status and missing profile columns to profiles and wallet_profiles,
-- updates handle_new_user trigger function, configures RLS policies, and triggers a PostgREST schema cache reload.

-- ========================================================
-- 1. ADD MISSING COLUMNS TO PROFILES & WALLET_PROFILES
-- ========================================================

-- Ensure columns exist on public.profiles
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'incomplete',
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure columns exist on public.wallet_profiles
ALTER TABLE IF EXISTS public.wallet_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'incomplete',
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill any existing NULL onboarding_status values to 'incomplete' or 'completed'
UPDATE public.profiles SET onboarding_status = 'incomplete' WHERE onboarding_status IS NULL;
UPDATE public.wallet_profiles SET onboarding_status = 'incomplete' WHERE onboarding_status IS NULL;

-- ========================================================
-- 2. REPAIR FOREIGN KEYS TO auth.users(id)
-- ========================================================
DO $$
DECLARE
  tbl TEXT;
  fk_record RECORD;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
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
  ]) LOOP

    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN

      FOR fk_record IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE nsp.nspname = 'public'
          AND rel.relname = tbl
          AND att.attname = 'user_id'
          AND con.contype = 'f'
      ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I;', tbl, fk_record.conname);
      END LOOP;

      EXECUTE format('
        ALTER TABLE public.%I 
        ADD CONSTRAINT %I 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
      ', tbl, tbl || '_user_id_fkey');

    END IF;

  END LOOP;
END;
$$;

-- ========================================================
-- 3. ENABLE ROW LEVEL SECURITY & UPDATE RLS POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallet_profiles_select_own" ON public.wallet_profiles;
DROP POLICY IF EXISTS "wallet_profiles_insert_own" ON public.wallet_profiles;
DROP POLICY IF EXISTS "wallet_profiles_update_own" ON public.wallet_profiles;

CREATE POLICY "wallet_profiles_select_own" ON public.wallet_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallet_profiles_insert_own" ON public.wallet_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallet_profiles_update_own" ON public.wallet_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ========================================================
-- 4. UPDATE handle_new_user() TRIGGER FUNCTION
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profiles
  INSERT INTO public.profiles (user_id, display_name, email, onboarding_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', SUBSTRING(new.email FROM '^[^@]+')),
    new.email,
    'incomplete'
  ) ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.wallet_profiles (user_id, display_name, email, onboarding_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', SUBSTRING(new.email FROM '^[^@]+')),
    new.email,
    'incomplete'
  ) ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.wallet_profiles.display_name, EXCLUDED.display_name);

  -- Preferences
  INSERT INTO public.user_preferences (user_id, currency, language, theme)
  VALUES (new.id, 'USD', 'en', 'dark')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallet_preferences (user_id, active_network)
  VALUES (new.id, 'arbitrum')
  ON CONFLICT (user_id) DO NOTHING;

  -- Settings
  INSERT INTO public.security_settings (user_id, biometrics_enabled, passcode_enabled, auto_lock_minutes)
  VALUES (new.id, true, true, 1)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallet_settings (user_id, biometrics_enabled, passcode_enabled, auto_lock_minutes)
  VALUES (new.id, true, true, 1)
  ON CONFLICT (user_id) DO NOTHING;

  -- Notifications
  INSERT INTO public.notification_settings (user_id, push_enabled, email_enabled)
  VALUES (new.id, true, false)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallet_notifications (user_id, push_enabled, email_enabled)
  VALUES (new.id, true, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- 5. RELOAD POSTGREST SCHEMA CACHE
-- ========================================================
NOTIFY pgrst, 'reload schema';
