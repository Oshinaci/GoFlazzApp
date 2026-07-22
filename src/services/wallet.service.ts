import { supabase } from "@/lib/supabaseClient";
import { generateMnemonic, walletFromMnemonic } from "@/lib/wallet";
import { SecurityService } from "@/services/security.service";

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
  static async ensureDefaultWallet(userId: string, pin?: string): Promise<WalletRecord | null> {
    try {
      const existingWallets = await WalletService.getWallets(userId);
      if (existingWallets.length > 0) {
        return existingWallets.find((w) => w.is_primary) || existingWallets[0];
      }

      // Generate a new secure EVM wallet
      const mnemonicPhrase = generateMnemonic();
      const ethWallet = walletFromMnemonic(mnemonicPhrase, 0);
      const privateKey = ethWallet.privateKey;
      const address = ethWallet.address;

      const secretPin = pin || `123456`;
      const tempId = "default-primary";

      const encryptedMnemonic = await SecurityService.encryptWallet(mnemonicPhrase, secretPin, userId, tempId);
      const encryptedPrivateKey = await SecurityService.encryptWallet(privateKey, secretPin, userId, tempId);

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

      // Wipe sensitive memory
      SecurityService.wipeMemory({ mnemonicPhrase, privateKey });

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
   * Lock wallet session
   */
  static async lockWallet(userId: string): Promise<void> {
    await SecurityService.resetPinAttempts(userId);
  }

  /**
   * Unlock a wallet using user PIN.
   * Verifies PIN, enforces 15-minute lock on 5 failed attempts, derives HKDF key,
   * decrypts secrets, and returns decrypted keys.
   */
  static async unlockWallet(
    userId: string,
    pin: string,
    walletId?: string
  ): Promise<{ privateKey: string; mnemonic: string | null }> {
    const lockCheck = await SecurityService.checkBruteForceLock(userId);
    if (lockCheck.isLocked) {
      throw new Error(`Wallet is locked due to security limits. Please try again in ${lockCheck.remainingSeconds}s.`);
    }

    const sec = await SecurityService.getWalletSecurity(userId);
    if (!sec || !sec.pin_hash) {
      throw new Error("No PIN is configured for this account.");
    }

    const isValid = await SecurityService.verifyPin(userId, pin);
    if (!isValid) {
      const { nextAttempts, lockedUntil } = await SecurityService.recordFailedAttempt(
        userId,
        sec.pin_attempts || 0
      );
      if (nextAttempts >= 5 || lockedUntil) {
        throw new Error("Too many failed attempts. Your wallet access is locked for 15 minutes.");
      }
      throw new Error(`Incorrect PIN. ${5 - nextAttempts} attempts remaining.`);
    }

    await SecurityService.resetPinAttempts(userId);

    const wallets = await WalletService.getWallets(userId);
    if (wallets.length === 0) {
      throw new Error("No wallets found for user.");
    }

    const targetWallet = walletId
      ? wallets.find((w) => w.id === walletId) || wallets[0]
      : wallets.find((w) => w.is_primary) || wallets[0];

    const encryptedKeys = await WalletService.getEncryptedKeys(targetWallet.id, userId);

    const privateKey = await SecurityService.decryptWallet(
      encryptedKeys.encrypted_private_key,
      pin,
      userId,
      targetWallet.id
    );

    let mnemonic: string | null = null;
    if (encryptedKeys.encrypted_mnemonic) {
      mnemonic = await SecurityService.decryptWallet(
        encryptedKeys.encrypted_mnemonic,
        pin,
        userId,
        targetWallet.id
      );
    }

    return { privateKey, mnemonic };
  }

  /**
   * Change security PIN and re-encrypt all user wallets with new HKDF key derived from new PIN
   */
  static async changePin(userId: string, oldPin: string, newPin: string): Promise<void> {
    const isValid = await SecurityService.verifyPin(userId, oldPin);
    if (!isValid) {
      throw new Error("Current PIN is incorrect.");
    }

    const wallets = await WalletService.getWallets(userId);

    for (const w of wallets) {
      const keys = await WalletService.getEncryptedKeys(w.id, userId);
      const rawPrivateKey = await SecurityService.decryptWallet(
        keys.encrypted_private_key,
        oldPin,
        userId,
        w.id
      );

      let rawMnemonic: string | null = null;
      if (keys.encrypted_mnemonic) {
        rawMnemonic = await SecurityService.decryptWallet(
          keys.encrypted_mnemonic,
          oldPin,
          userId,
          w.id
        );
      }

      const newEncPrivateKey = await SecurityService.encryptWallet(
        rawPrivateKey,
        newPin,
        userId,
        w.id
      );

      let newEncMnemonic: string | null = null;
      if (rawMnemonic) {
        newEncMnemonic = await SecurityService.encryptWallet(
          rawMnemonic,
          newPin,
          userId,
          w.id
        );
      }

      await WalletService.updateWalletKeys(
        w.id,
        userId,
        newEncMnemonic || "",
        newEncPrivateKey
      );

      SecurityService.wipeMemory({ rawPrivateKey, rawMnemonic });
    }

    await SecurityService.upsertPIN(userId, newPin);
  }

  /**
   * Encrypt plaintext using HKDF key derived from PIN, userId, walletId
   */
  static async encryptWallet(
    plaintext: string,
    pin: string,
    userId: string,
    walletId: string
  ): Promise<string> {
    return SecurityService.encryptWallet(plaintext, pin, userId, walletId);
  }

  /**
   * Decrypt payload using HKDF key derived from PIN, userId, walletId
   */
  static async decryptWallet(
    encryptedPayload: string,
    pin: string,
    userId: string,
    walletId: string
  ): Promise<string> {
    return SecurityService.decryptWallet(encryptedPayload, pin, userId, walletId);
  }

  /**
   * Update encrypted keys for an existing wallet
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

