import { supabase, safeStringify } from "@/lib/supabaseClient";

export interface WalletDbRecord {
  id: string;
  user_id: string;
  name: string;
  address: string;
  encrypted_mnemonic: string | null;
  encrypted_private_key: string;
  is_primary: boolean;
  network: string;
  chain_type?: string;
  wallet_type?: string;
  derivation_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class WalletRepository {
  static async getWallets(userId: string): Promise<WalletDbRecord[]> {
    try {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error || !data) {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("mock_db_user_wallets");
          const items = raw ? JSON.parse(raw) : [];
          return items.filter((i: any) => i.user_id === userId);
        }
        return [];
      }
      return data as WalletDbRecord[];
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("mock_db_user_wallets");
        const items = raw ? JSON.parse(raw) : [];
        return items.filter((i: any) => i.user_id === userId);
      }
      return [];
    }
  }

  static async saveWallet(record: WalletDbRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_wallets")
        .upsert(record, { onConflict: "id" });

      if (error && typeof window !== "undefined") {
        const raw = localStorage.getItem("mock_db_user_wallets");
        const items = raw ? JSON.parse(raw) : [];
        const idx = items.findIndex((i: any) => i.id === record.id);
        if (idx !== -1) {
          items[idx] = record;
        } else {
          items.push(record);
        }
        localStorage.setItem("mock_db_user_wallets", safeStringify(items));
      }
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("mock_db_user_wallets");
        const items = raw ? JSON.parse(raw) : [];
        items.push(record);
        localStorage.setItem("mock_db_user_wallets", safeStringify(items));
      }
    }
  }

  static async deleteWallet(walletId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from("user_wallets")
        .delete()
        .eq("id", walletId)
        .eq("user_id", userId);

      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("mock_db_user_wallets");
        const items = raw ? JSON.parse(raw) : [];
        const filtered = items.filter((i: any) => !(i.id === walletId && i.user_id === userId));
        localStorage.setItem("mock_db_user_wallets", safeStringify(filtered));
      }
    } catch {
      // ignore
    }
  }
}
