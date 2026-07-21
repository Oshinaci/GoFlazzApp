import { supabase } from "@/lib/supabaseClient";

export interface WalletPreferencesRecord {
  id?: string;
  user_id: string;
  active_wallet_id: string | null;
  active_network: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesRecord {
  id?: string;
  user_id: string;
  currency: string;
  language: string;
  theme: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationSettingsRecord {
  id?: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export class PreferencesService {
  /**
   * Get active wallet preferences (active_wallet_id, active_network)
   */
  static async getWalletPreferences(userId: string): Promise<WalletPreferencesRecord | null> {
    const { data, error } = await supabase
      .from("wallet_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[PreferencesService.getWalletPreferences]", error);
      return null;
    }

    return data as WalletPreferencesRecord | null;
  }

  /**
   * Upsert wallet preferences
   */
  static async updateWalletPreferences(userId: string, activeWalletId: string | null, activeNetwork: string): Promise<void> {
    const { error } = await supabase
      .from("wallet_preferences")
      .upsert({
        user_id: userId,
        active_wallet_id: activeWalletId,
        active_network: activeNetwork,
      }, { onConflict: "user_id" });

    if (error) {
      console.error("[PreferencesService.updateWalletPreferences]", error);
    }
  }

  /**
   * Get user preferences (currency, language, theme)
   */
  static async getUserPreferences(userId: string): Promise<UserPreferencesRecord | null> {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[PreferencesService.getUserPreferences]", error);
      return null;
    }

    return data as UserPreferencesRecord | null;
  }

  /**
   * Update user preference field
   */
  static async updateUserPreference(userId: string, key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });

    if (error) {
      console.error("[PreferencesService.updateUserPreference]", error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(userId: string): Promise<NotificationSettingsRecord | null> {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[PreferencesService.getNotificationSettings]", error);
      return null;
    }

    return data as NotificationSettingsRecord | null;
  }

  /**
   * Update notification setting
   */
  static async updateNotificationSetting(userId: string, key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from("notification_settings")
      .upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });

    if (error) {
      console.error("[PreferencesService.updateNotificationSetting]", error);
      throw error;
    }

    // Sync to wallet_notifications as well
    await supabase.from("wallet_notifications").upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });
  }
}
