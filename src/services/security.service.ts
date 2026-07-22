import { supabase } from "@/lib/supabaseClient";
import {
  hashPin,
  encryptWithHkdf,
  decryptWithHkdf,
  constantTimeCompare,
  wipeMemory,
  deriveHkdfKey,
} from "@/lib/encryption";

export interface WalletSecurityRecord {
  id?: string;
  user_id: string;
  pin_hash: string;
  pin_attempts: number;
  locked_until: string | null;
  last_unlock?: string | null;
  biometrics_supported: boolean;
  biometrics_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SecuritySettingsRecord {
  id?: string;
  user_id: string;
  biometrics_enabled: boolean;
  passcode_enabled: boolean;
  auto_lock_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export class SecurityService {
  /**
   * Constant-time comparison wrapper
   */
  static constantTimeCompare(a: string, b: string): boolean {
    return constantTimeCompare(a, b);
  }

  /**
   * Securely wipe memory buffers
   */
  static wipeMemory(...args: any[]): void {
    wipeMemory(...args);
  }

  /**
   * Derive encryption key using HKDF(PIN, user_id, wallet_id)
   */
  static async deriveHkdfKey(pin: string, userId: string, walletId: string): Promise<CryptoKey> {
    return deriveHkdfKey(pin, userId, walletId);
  }

  /**
   * Encrypt a wallet secret (private key or mnemonic) using HKDF AES-256-GCM
   */
  static async encryptWallet(
    plaintext: string,
    pin: string,
    userId: string,
    walletId: string
  ): Promise<string> {
    return encryptWithHkdf(plaintext, pin, userId, walletId);
  }

  /**
   * Decrypt a wallet secret (private key or mnemonic) using HKDF AES-256-GCM
   */
  static async decryptWallet(
    encryptedBase64: string,
    pin: string,
    userId: string,
    walletId: string
  ): Promise<string> {
    return decryptWithHkdf(encryptedBase64, pin, userId, walletId);
  }

  /**
   * Get wallet security state
   */
  static async getWalletSecurity(userId: string): Promise<WalletSecurityRecord | null> {
    const { data, error } = await supabase
      .from("wallet_security")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[SecurityService.getWalletSecurity]", error);
      return null;
    }

    return data as WalletSecurityRecord | null;
  }

  /**
   * Check if wallet is locked due to brute-force protection
   */
  static async checkBruteForceLock(userId: string): Promise<{
    isLocked: boolean;
    remainingSeconds: number;
    lockedUntil: string | null;
  }> {
    const sec = await SecurityService.getWalletSecurity(userId);
    if (!sec || !sec.locked_until) {
      return { isLocked: false, remainingSeconds: 0, lockedUntil: null };
    }

    const lockTime = new Date(sec.locked_until).getTime();
    const now = Date.now();
    if (now < lockTime) {
      const remainingSeconds = Math.ceil((lockTime - now) / 1000);
      return { isLocked: true, remainingSeconds, lockedUntil: sec.locked_until };
    }

    // Lock expired, auto-clear lock
    await SecurityService.resetPinAttempts(userId);
    return { isLocked: false, remainingSeconds: 0, lockedUntil: null };
  }

  /**
   * Save or update PIN security record with hashed PIN
   */
  static async upsertPIN(userId: string, pin: string): Promise<void> {
    const biometricsSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;
    const pinHash = await hashPin(pin, userId);

    const { error } = await supabase
      .from("wallet_security")
      .upsert(
        {
          user_id: userId,
          pin_hash: pinHash,
          pin_attempts: 0,
          locked_until: null,
          biometrics_supported: biometricsSupported,
          biometrics_enabled: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("[SecurityService.upsertPIN]", error);
      throw error;
    }
  }

  /**
   * Verify entered PIN against stored hash
   */
  static async verifyPin(userId: string, pin: string): Promise<boolean> {
    const sec = await SecurityService.getWalletSecurity(userId);
    if (!sec || !sec.pin_hash) return false;

    const inputHash = await hashPin(pin, userId);
    return constantTimeCompare(inputHash, sec.pin_hash);
  }

  /**
   * Reset failed PIN attempts counter and update last_unlock
   */
  static async resetPinAttempts(userId: string): Promise<void> {
    const { error } = await supabase
      .from("wallet_security")
      .update({
        pin_attempts: 0,
        locked_until: null,
        last_unlock: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[SecurityService.resetPinAttempts]", error);
    }
  }

  /**
   * Record a failed PIN attempt with 15-minute brute force lockout on 5th failure
   */
  static async recordFailedAttempt(
    userId: string,
    currentAttempts: number
  ): Promise<{ nextAttempts: number; lockedUntil: string | null }> {
    const nextAttempts = currentAttempts + 1;
    let lockedUntil: string | null = null;

    if (nextAttempts >= 5) {
      // Lock for 15 minutes after 5 failed attempts
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    const { error } = await supabase
      .from("wallet_security")
      .update({
        pin_attempts: nextAttempts,
        locked_until: lockedUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[SecurityService.recordFailedAttempt]", error);
    }

    return { nextAttempts, lockedUntil };
  }

  /**
   * Update biometrics toggle in security
   */
  static async setBiometricsEnabled(userId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from("wallet_security")
      .update({ biometrics_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      console.error("[SecurityService.setBiometricsEnabled]", error);
      throw error;
    }

    await Promise.allSettled([
      supabase.from("security_settings").upsert({ user_id: userId, biometrics_enabled: enabled }, { onConflict: "user_id" }),
      supabase.from("wallet_settings").upsert({ user_id: userId, biometrics_enabled: enabled }, { onConflict: "user_id" }),
    ]);
  }

  /**
   * Get general security settings
   */
  static async getSecuritySettings(userId: string): Promise<SecuritySettingsRecord | null> {
    const { data, error } = await supabase
      .from("security_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[SecurityService.getSecuritySettings]", error);
      return null;
    }

    return data as SecuritySettingsRecord | null;
  }

  /**
   * Update general security settings
   */
  static async updateSecuritySetting(userId: string, key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from("security_settings")
      .upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (error) {
      console.error("[SecurityService.updateSecuritySetting]", error);
      throw error;
    }

    await supabase.from("wallet_settings").upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() });
  }
}

