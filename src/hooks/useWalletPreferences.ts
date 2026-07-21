"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PreferencesService, UserPreferencesRecord, WalletPreferencesRecord, NotificationSettingsRecord } from "@/services/preferences.service";
import { toast } from "sonner";

export function useWalletPreferences() {
  const { user } = useAuth();
  const [walletPrefs, setWalletPrefs] = useState<WalletPreferencesRecord | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferencesRecord | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettingsRecord | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setWalletPrefs(null);
      setUserPrefs(null);
      setNotifSettings(null);
      return;
    }

    const [wData, uData, nData] = await Promise.all([
      PreferencesService.getWalletPreferences(user.id),
      PreferencesService.getUserPreferences(user.id),
      PreferencesService.getNotificationSettings(user.id),
    ]);

    setWalletPrefs(wData);
    setUserPrefs(uData);
    setNotifSettings(nData);
  }, [user]);

  const updateWalletPref = async (activeWalletId: string | null, activeNetwork: string) => {
    if (!user) return;
    await PreferencesService.updateWalletPreferences(user.id, activeWalletId, activeNetwork);
    await fetchPreferences();
  };

  const updateUserPref = async (key: string, value: any) => {
    if (!user) return;
    try {
      await PreferencesService.updateUserPreference(user.id, key, value);
      await fetchPreferences();
      toast.success("Preference updated successfully.");
    } catch (err: any) {
      toast.error("Failed updating preference: " + err.message);
    }
  };

  const updateNotifSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      await PreferencesService.updateNotificationSetting(user.id, key, value);
      await fetchPreferences();
      toast.success("Notification setting updated.");
    } catch (err: any) {
      toast.error("Failed updating notification setting: " + err.message);
    }
  };

  return {
    walletPrefs,
    userPrefs,
    notifSettings,
    fetchPreferences,
    updateWalletPref,
    updateUserPref,
    updateNotifSetting,
  };
}
