import { supabase, safeStringify } from "@/lib/supabaseClient";
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

function getLocalWalletSecurity(userId: string): WalletSecurityRecord {
  if (typeof window === "undefined") {
    return {
      user_id: userId,
      pin_hash: "",
      pin_attempts: 0,
      locked_until: null,
      last_unlock: null,
      biometrics_supported: false,
      biometrics_enabled: false,
    };
  }
  const key = `wallet_sec_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  const defaultVal: WalletSecurityRecord = {
    user_id: userId,
    pin_hash: "",
    pin_attempts: 0,
    locked_until: null,
    last_unlock: null,
    biometrics_supported: !!window.PublicKeyCredential,
    biometrics_enabled: false,
  };
  localStorage.setItem(key, safeStringify(defaultVal));
  return defaultVal;
}

function setLocalWalletSecurity(userId: string, record: WalletSecurityRecord) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`wallet_sec_${userId}`, safeStringify(record));
  }
}

function getLocalSecuritySettings(userId: string): SecuritySettingsRecord {
  if (typeof window === "undefined") {
    return {
      user_id: userId,
      biometrics_enabled: false,
      passcode_enabled: true,
      auto_lock_minutes: 5,
    };
  }
  const key = `sec_settings_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  const defaultVal: SecuritySettingsRecord = {
    user_id: userId,
    biometrics_enabled: false,
    passcode_enabled: true,
    auto_lock_minutes: 5,
  };
  localStorage.setItem(key, safeStringify(defaultVal));
  return defaultVal;
}

function setLocalSecuritySettings(userId: string, record: SecuritySettingsRecord) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`sec_settings_${userId}`, safeStringify(record));
  }
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
    try {
      const { data, error } = await supabase
        .from("wallet_security")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return getLocalWalletSecurity(userId);
      }

      return data as WalletSecurityRecord;
    } catch (_) {
      return getLocalWalletSecurity(userId);
    }
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

    const record: WalletSecurityRecord = {
      user_id: userId,
      pin_hash: pinHash,
      pin_attempts: 0,
      locked_until: null,
      biometrics_supported: biometricsSupported,
      biometrics_enabled: false,
      updated_at: new Date().toISOString(),
    };

    setLocalWalletSecurity(userId, record);

    try {
      await supabase
        .from("wallet_security")
        .upsert(record, { onConflict: "user_id" });
    } catch (_) {}
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
    const sec = getLocalWalletSecurity(userId);
    sec.pin_attempts = 0;
    sec.locked_until = null;
    sec.last_unlock = new Date().toISOString();
    sec.updated_at = new Date().toISOString();
    setLocalWalletSecurity(userId, sec);

    try {
      await supabase
        .from("wallet_security")
        .update({
          pin_attempts: 0,
          locked_until: null,
          last_unlock: sec.last_unlock,
          updated_at: sec.updated_at,
        })
        .eq("user_id", userId);
    } catch (_) {}
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
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    const sec = getLocalWalletSecurity(userId);
    sec.pin_attempts = nextAttempts;
    sec.locked_until = lockedUntil;
    sec.updated_at = new Date().toISOString();
    setLocalWalletSecurity(userId, sec);

    try {
      await supabase
        .from("wallet_security")
        .update({
          pin_attempts: nextAttempts,
          locked_until: lockedUntil,
          updated_at: sec.updated_at,
        })
        .eq("user_id", userId);
    } catch (_) {}

    return { nextAttempts, lockedUntil };
  }

  /**
   * Update biometrics toggle in security
   */
  static async setBiometricsEnabled(userId: string, enabled: boolean): Promise<void> {
    const sec = getLocalWalletSecurity(userId);
    sec.biometrics_enabled = enabled;
    sec.updated_at = new Date().toISOString();
    setLocalWalletSecurity(userId, sec);

    const settings = getLocalSecuritySettings(userId);
    settings.biometrics_enabled = enabled;
    setLocalSecuritySettings(userId, settings);

    try {
      await supabase
        .from("wallet_security")
        .update({ biometrics_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      await Promise.allSettled([
        supabase.from("security_settings").upsert({ user_id: userId, biometrics_enabled: enabled }, { onConflict: "user_id" }),
        supabase.from("wallet_settings").upsert({ user_id: userId, biometrics_enabled: enabled }, { onConflict: "user_id" }),
      ]);
    } catch (_) {}
  }

  /**
   * Get general security settings
   */
  static async getSecuritySettings(userId: string): Promise<SecuritySettingsRecord | null> {
    try {
      const { data, error } = await supabase
        .from("security_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return getLocalSecuritySettings(userId);
      }

      return data as SecuritySettingsRecord;
    } catch (_) {
      return getLocalSecuritySettings(userId);
    }
  }

  /**
   * Update general security settings
   */
  static async updateSecuritySetting(userId: string, key: string, value: any): Promise<void> {
    const settings = getLocalSecuritySettings(userId);
    (settings as any)[key] = value;
    settings.updated_at = new Date().toISOString();
    setLocalSecuritySettings(userId, settings);

    try {
      await supabase
        .from("security_settings")
        .upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      await supabase.from("wallet_settings").upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() });
    } catch (_) {}
  }
}
