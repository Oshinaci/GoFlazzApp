"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSecurity } from "@/hooks/useWalletSecurity";
import { AutoLockEngine } from "@/security/auto-lock.service";
import { ScreenProtectionService } from "@/security/screen-protection.service";
import { EmergencyModeService } from "@/security/emergency-mode.service";
import { SecurityCenterService, SecurityDashboardData } from "@/security/security-center.service";
import { TransactionSecurityGuard, TransactionAuthRequest, TransactionAuthResult } from "@/services/transaction-security.service";
import { FraudDetectionService, FraudCheckParams } from "@/security/fraud-detection.service";
import { AutoLockOption } from "@/types/security-engine";
import { toast } from "sonner";

export function useSecurityEngine() {
  const { user } = useAuth();
  const walletSec = useWalletSecurity();

  const [autoLockSetting, setAutoLockSetting] = useState<AutoLockOption>("5m");
  const [isPrivacyBlurred, setIsPrivacyBlurred] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);

  // Initialize Screen Protection & Auto Lock
  useEffect(() => {
    ScreenProtectionService.init((isBlurred) => {
      setIsPrivacyBlurred(isBlurred);
    });

    AutoLockEngine.init(autoLockSetting, (isLocked) => {
      if (isLocked) {
        walletSec.lockWallet();
        toast.info("Wallet auto-locked due to inactivity");
      }
    });
  }, [autoLockSetting, walletSec]);

  // Load Security Dashboard Data
  const refreshDashboard = useCallback(async () => {
    if (!user) return;
    setIsLoadingDashboard(true);
    try {
      const data = await SecurityCenterService.getDashboardData(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error("[useSecurityEngine.refreshDashboard]", err);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [user]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Pre-flight transaction authorization
  const authorizeAction = useCallback(
    async (req: Omit<TransactionAuthRequest, "userId">): Promise<TransactionAuthResult> => {
      if (!user) {
        return { authorized: false, reason: "User not authenticated", riskScore: 100 };
      }
      return await TransactionSecurityGuard.authorizeAction({ ...req, userId: user.id });
    },
    [user]
  );

  // Trigger Emergency Freeze
  const triggerEmergencyLock = async (reason?: string) => {
    if (!user) return;
    await EmergencyModeService.triggerEmergencyLock(user.id, reason, "User Triggered");
    walletSec.lockWallet();
    await refreshDashboard();
    toast.error("Emergency Lock Activated! Wallet frozen.");
  };

  // Release Emergency Freeze
  const releaseEmergencyLock = async () => {
    if (!user) return;
    await EmergencyModeService.releaseEmergencyLock(user.id);
    await refreshDashboard();
    toast.success("Emergency Lock Released!");
  };

  // Run Fraud Risk Check
  const checkFraudRisk = async (params: Omit<FraudCheckParams, "userId">) => {
    if (!user) return null;
    return await FraudDetectionService.evaluateFraudRisk({ ...params, userId: user.id });
  };

  return {
    ...walletSec,
    isPrivacyBlurred,
    autoLockSetting,
    setAutoLockSetting,
    dashboardData,
    isLoadingDashboard,
    refreshDashboard,
    authorizeAction,
    triggerEmergencyLock,
    releaseEmergencyLock,
    checkFraudRisk,
  };
}
