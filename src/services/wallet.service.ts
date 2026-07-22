import { supabase } from "@/lib/supabaseClient";
import { generateMnemonic, walletFromMnemonic } from "@/lib/wallet";
import { encryptData } from "@/lib/encryption";

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

  /**
   * Ensure that a user has at least one self-custodial wallet.
   * Automatically creates an EVM-compatible primary wallet if none exists.
   * Idempotent and safe against concurrent requests or retries.
   */
  static async ensureDefaultWallet(userId: string, encryptionSecret?: string): Promise<WalletRecord | null> {
    try {
      const existingWallets = await WalletService.getWallets(userId);
      if (existingWallets.length > 0) {
        return existingWallets.find((w) => w.is_primary) || existingWallets[0];
      }

      // Generate a new secure EVM wallet (Ethereum-compatible)
      const mnemonicPhrase = generateMnemonic();
      const ethWallet = walletFromMnemonic(mnemonicPhrase, 0);
      const privateKey = ethWallet.privateKey;
      const address = ethWallet.address;

      const secret = encryptionSecret || `goflazz_sec_${userId}`;
      const encryptedMnemonic = await encryptData(mnemonicPhrase, secret);
      const encryptedPrivateKey = await encryptData(privateKey, secret);

      const newWallet = await WalletService.createWallet({
        user_id: userId,
        name: "Primary Wallet",
        address: address,
        encrypted_mnemonic: encryptedMnemonic,
        encrypted_private_key: encryptedPrivateKey,
        is_primary: true,
        network: "arbitrum",
        chain_type: "evm",
        wallet_type: "hd_mnemonic",
        derivation_path: "m/44'/60'/0'/0/0",
      });

      return newWallet;
    } catch (err: any) {
      console.error("[WalletService.ensureDefaultWallet]", err);
      try {
        const recheck = await WalletService.getWallets(userId);
        if (recheck.length > 0) {
          return recheck.find((w) => w.is_primary) || recheck[0];
        }
      } catch {
        // ignore
      }
      return null;
    }
  }

  /**
   * Update encrypted keys for an existing wallet (e.g., when setting or updating security PIN)
   */
  static async updateWalletKeys(
    walletId: string,
    userId: string,
    encryptedMnemonic: string,
    encryptedPrivateKey: string
  ): Promise<void> {
    const { error } = await supabase
      .from("user_wallets")
      .update({
        encrypted_mnemonic: encryptedMnemonic,
        encrypted_private_key: encryptedPrivateKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", walletId)
      .eq("user_id", userId);

    if (error) {
      console.error("[WalletService.updateWalletKeys]", error);
      throw error;
    }
  }
}
