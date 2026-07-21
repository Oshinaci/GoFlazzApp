// Mirrors supabase/schema.sql. Regenerate with `supabase gen types typescript`
// once the project is linked, and replace this hand-written version.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          address: string;
          encrypted_private_key: string;
          chain: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallets"]["Row"]> & {
          user_id: string;
          label: string;
          address: string;
          encrypted_private_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallets"]["Row"]>;
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          language: string;
          theme: string;
          auto_lock_minutes: number;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["settings"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          coin_id: string;
          symbol: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["watchlists"]["Row"]> & {
          user_id: string;
          coin_id: string;
          symbol: string;
        };
        Update: Partial<Database["public"]["Tables"]["watchlists"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          title: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
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
    };
  };
}
