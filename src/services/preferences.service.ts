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

function getLocalWalletPreferences(userId: string): WalletPreferencesRecord {
  if (typeof window === "undefined") {
    return { user_id: userId, active_wallet_id: null, active_network: "ethereum" };
  }
  const key = `wallet_prefs_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  const defaultVal: WalletPreferencesRecord = {
    user_id: userId,
    active_wallet_id: null,
    active_network: "ethereum",
  };
  localStorage.setItem(key, JSON.stringify(defaultVal));
  return defaultVal;
}

function setLocalWalletPreferences(userId: string, record: WalletPreferencesRecord) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`wallet_prefs_${userId}`, JSON.stringify(record));
  }
}

function getLocalUserPreferences(userId: string): UserPreferencesRecord {
  if (typeof window === "undefined") {
    return { user_id: userId, currency: "USD", language: "English", theme: "dark" };
  }
  const key = `user_prefs_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  const defaultVal: UserPreferencesRecord = {
    user_id: userId,
    currency: "USD",
    language: "English",
    theme: "dark",
  };
  localStorage.setItem(key, JSON.stringify(defaultVal));
  return defaultVal;
}

function setLocalUserPreferences(userId: string, record: UserPreferencesRecord) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`user_prefs_${userId}`, JSON.stringify(record));
  }
}

function getLocalNotificationSettings(userId: string): NotificationSettingsRecord {
  if (typeof window === "undefined") {
    return { user_id: userId, push_enabled: true, email_enabled: true };
  }
  const key = `notif_settings_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  const defaultVal: NotificationSettingsRecord = {
    user_id: userId,
    push_enabled: true,
    email_enabled: true,
  };
  localStorage.setItem(key, JSON.stringify(defaultVal));
  return defaultVal;
}

function setLocalNotificationSettings(userId: string, record: NotificationSettingsRecord) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`notif_settings_${userId}`, JSON.stringify(record));
  }
}

export class PreferencesService {
  /**
   * Get active wallet preferences (active_wallet_id, active_network)
   */
  static async getWalletPreferences(userId: string): Promise<WalletPreferencesRecord | null> {
    try {
      const { data, error } = await supabase
        .from("wallet_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return getLocalWalletPreferences(userId);
      }

      return data as WalletPreferencesRecord;
    } catch (_) {
      return getLocalWalletPreferences(userId);
    }
  }

  /**
   * Upsert wallet preferences
   */
  static async updateWalletPreferences(userId: string, activeWalletId: string | null, activeNetwork: string): Promise<void> {
    const updatedRecord: WalletPreferencesRecord = {
      user_id: userId,
      active_wallet_id: activeWalletId,
      active_network: activeNetwork,
      updated_at: new Date().toISOString(),
    };
    setLocalWalletPreferences(userId, updatedRecord);

    try {
      await supabase
        .from("wallet_preferences")
        .upsert(updatedRecord, { onConflict: "user_id" });
    } catch (_) {}
  }

  /**
   * Get user preferences (currency, language, theme)
   */
  static async getUserPreferences(userId: string): Promise<UserPreferencesRecord | null> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return getLocalUserPreferences(userId);
      }

      return data as UserPreferencesRecord;
    } catch (_) {
      return getLocalUserPreferences(userId);
    }
  }

  /**
   * Update user preference field
   */
  static async updateUserPreference(userId: string, key: string, value: any): Promise<void> {
    const current = getLocalUserPreferences(userId);
    const updated = { ...current, [key]: value, updated_at: new Date().toISOString() };
    setLocalUserPreferences(userId, updated);

    try {
      await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });
    } catch (_) {}
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(userId: string): Promise<NotificationSettingsRecord | null> {
    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return getLocalNotificationSettings(userId);
      }

      return data as NotificationSettingsRecord;
    } catch (_) {
      return getLocalNotificationSettings(userId);
    }
  }

  /**
   * Update notification setting
   */
  static async updateNotificationSetting(userId: string, key: string, value: any): Promise<void> {
    const current = getLocalNotificationSettings(userId);
    const updated = { ...current, [key]: value, updated_at: new Date().toISOString() };
    setLocalNotificationSettings(userId, updated);

    try {
      await supabase
        .from("notification_settings")
        .upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });
      await supabase
        .from("wallet_notifications")
        .upsert({ user_id: userId, [key]: value }, { onConflict: "user_id" });
    } catch (_) {}
  }
}
