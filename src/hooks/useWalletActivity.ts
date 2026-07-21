"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ActivityService, WalletActivityRecord } from "@/services/activity.service";

export function useWalletActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<WalletActivityRecord[]>([]);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      return;
    }
    const logs = await ActivityService.getActivityLogs(user.id);
    setActivities(logs);
  }, [user]);

  const logActivity = async (action: string, metadata: Record<string, unknown> = {}) => {
    if (!user) return;
    await ActivityService.logActivity(user.id, action, metadata);
    await fetchActivities();
  };

  return {
    activities,
    fetchActivities,
    logActivity,
  };
}
