// Mirrors /supabase/schema.sql

export interface Database {
  public: {
    Tables: {
      wallet_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          onboarding_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_profiles"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["wallet_profiles"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          onboarding_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      user_wallets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          encrypted_mnemonic: string | null;
          encrypted_private_key: string;
          is_primary: boolean;
          network: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_wallets"]["Row"]> & {
          user_id: string;
          name: string;
          address: string;
          encrypted_private_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_wallets"]["Row"]>;
      };
      wallet_security: {
        Row: {
          id: string;
          user_id: string;
          pin_hash: string;
          pin_attempts: number;
          locked_until: string | null;
          biometrics_supported: boolean;
          biometrics_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_security"]["Row"]> & {
          user_id: string;
          pin_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_security"]["Row"]>;
      };
      wallet_settings: {
        Row: {
          id: string;
          user_id: string;
          biometrics_enabled: boolean;
          passcode_enabled: boolean;
          auto_lock_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_settings"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["wallet_settings"]["Row"]>;
      };
      security_settings: {
        Row: {
          id: string;
          user_id: string;
          biometrics_enabled: boolean;
          passcode_enabled: boolean;
          auto_lock_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["security_settings"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["security_settings"]["Row"]>;
      };
      wallet_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_contacts"]["Row"]> & {
          user_id: string;
          name: string;
          address: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_contacts"]["Row"]>;
      };
      wallet_balances: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          asset_symbol: string;
          balance: number;
          token_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_balances"]["Row"]> & {
          user_id: string;
          asset_symbol: string;
          balance: number;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_balances"]["Row"]>;
      };
      wallet_activity: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          action: string;
          type: string | null;
          amount: number | null;
          symbol: string | null;
          counterparty: string | null;
          status: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_activity"]["Row"]> & {
          user_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_activity"]["Row"]>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> & {
          user_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
      };
      wallet_preferences: {
        Row: {
          id: string;
          user_id: string;
          active_wallet_id: string | null;
          active_network: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_preferences"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["wallet_preferences"]["Row"]>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          language: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_preferences"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["user_preferences"]["Row"]>;
      };
      wallet_notifications: {
        Row: {
          id: string;
          user_id: string;
          push_enabled: boolean;
          email_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_notifications"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["wallet_notifications"]["Row"]>;
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          push_enabled: boolean;
          email_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notification_settings"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["notification_settings"]["Row"]>;
      };
      wallet_devices: {
        Row: {
          id: string;
          user_id: string;
          device_name: string;
          device_type: string | null;
          ip_address: string | null;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_devices"]["Row"]> & {
          user_id: string;
          device_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_devices"]["Row"]>;
      };
    };
  };
}
