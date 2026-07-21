import { supabase } from "@/lib/supabaseClient";

export interface WalletSecurityRecord {
  id?: string;
  user_id: string;
  pin_hash: string;
  pin_attempts: number;
  locked_until: string | null;
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
   * Save or update PIN security record
   */
  static async upsertPIN(userId: string, pinHash: string): Promise<void> {
    const biometricsSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;
    const { error } = await supabase
      .from("wallet_security")
      .upsert({
        user_id: userId,
        pin_hash: pinHash,
        pin_attempts: 0,
        locked_until: null,
        biometrics_supported: biometricsSupported,
        biometrics_enabled: false,
      }, { onConflict: "user_id" });

    if (error) {
      console.error("[SecurityService.upsertPIN]", error);
      throw error;
    }
  }

  /**
   * Reset failed PIN attempts counter
   */
  static async resetPinAttempts(userId: string): Promise<void> {
    const { error } = await supabase
      .from("wallet_security")
      .update({ pin_attempts: 0, locked_until: null })
      .eq("user_id", userId);

    if (error) {
      console.error("[SecurityService.resetPinAttempts]", error);
    }
  }

  /**
   * Record a failed PIN attempt
   */
  static async recordFailedAttempt(userId: string, currentAttempts: number): Promise<{ nextAttempts: number; lockedUntil: string | null }> {
    const nextAttempts = currentAttempts + 1;
    let lockedUntil: string | null = null;

    if (nextAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    }

    const { error } = await supabase
      .from("wallet_security")
      .update({ pin_attempts: nextAttempts, locked_until: lockedUntil })
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
      .update({ biometrics_enabled: enabled })
      .eq("user_id", userId);

    if (error) {
      console.error("[SecurityService.setBiometricsEnabled]", error);
      throw error;
    }

    // Also sync to security_settings & wallet_settings
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
   * Update general security settings (passcode_enabled, auto_lock_minutes, etc.)
   */
  static async updateSecuritySetting(userId: string, key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from("security_settings")
      .upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });

    if (error) {
      console.error("[SecurityService.updateSecuritySetting]", error);
      throw error;
    }

    // Sync to wallet_settings as well
    await supabase.from("wallet_settings").upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });
  }
}
