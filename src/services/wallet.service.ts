import { supabase } from "@/lib/supabaseClient";

export interface WalletRecord {
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

export class WalletService {
  /**
   * Fetch all wallets associated with a user
   */
  static async getWallets(userId: string): Promise<WalletRecord[]> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[WalletService.getWallets]", error);
      throw error;
    }

    return (data || []) as WalletRecord[];
  }

  /**
   * Create a new wallet record
   */
  static async createWallet(walletData: {
    user_id: string;
    name: string;
    address: string;
    encrypted_mnemonic: string;
    encrypted_private_key: string;
    is_primary: boolean;
    network: string;
    chain_type?: string;
    wallet_type?: string;
    derivation_path?: string;
  }): Promise<WalletRecord> {
    const { data, error } = await supabase
      .from("user_wallets")
      .insert(walletData)
      .select()
      .single();

    if (error) {
      console.error("[WalletService.createWallet]", error);
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        throw new Error("This wallet address is already registered.");
      }
      throw error;
    }

    return data as WalletRecord;
  }

  /**
   * Rename an existing wallet
   */
  static async renameWallet(walletId: string, userId: string, newName: string): Promise<void> {
    const { error } = await supabase
      .from("user_wallets")
      .update({ name: newName })
      .eq("id", walletId)
      .eq("user_id", userId);

    if (error) {
      console.error("[WalletService.renameWallet]", error);
      throw error;
    }
  }

  /**
   * Delete a wallet record
   */
  static async removeWallet(walletId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("user_wallets")
      .delete()
      .eq("id", walletId)
      .eq("user_id", userId);

    if (error) {
      console.error("[WalletService.removeWallet]", error);
      throw error;
    }
  }

  /**
   * Fetch encrypted credentials for a specific wallet
   */
  static async getEncryptedKeys(walletId: string, userId: string): Promise<{
    encrypted_private_key: string;
    encrypted_mnemonic: string | null;
  }> {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("encrypted_private_key, encrypted_mnemonic")
      .eq("id", walletId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error("[WalletService.getEncryptedKeys]", error);
      throw error || new Error("Wallet secrets not found.");
    }

    return data;
  }
}
