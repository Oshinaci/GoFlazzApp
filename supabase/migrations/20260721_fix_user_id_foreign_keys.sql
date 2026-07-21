-- Migration: Fix Foreign Keys across all wallet and settings tables to reference auth.users(id)
-- File: /supabase/migrations/20260721_fix_user_id_foreign_keys.sql
-- Purpose: Safely drop legacy profiles(id) foreign key constraints on user_id and recreate them referencing auth.users(id) ON DELETE CASCADE

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
