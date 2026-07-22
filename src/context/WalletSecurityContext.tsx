"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SecurityService, WalletSecurityRecord } from "@/services/security.service";
import { WalletService } from "@/services/wallet.service";
import { toast } from "sonner";

const COMMON_PINS = [
  "123456", "654321", "000000", "111111", "222222", 
  "333333", "444444", "555555", "666666", "777777", 
  "888888", "999999", "121212", "343434", "565656"
];

interface WalletSecurityContextValue {
  isUnlocked: boolean;
  isLockedByBruteForce: boolean;
  remainingLockSeconds: number;
  lockedUntil: string | null;
  failedAttempts: number;
  securityState: WalletSecurityRecord | null;
  isBiometricsEnabled: boolean;
  isBiometricsSupported: boolean;
  canUnlockWithBiometrics: boolean;
  unlockWallet: (pin: string) => Promise<{ success: boolean; error?: string }>;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  lockWallet: () => void;
  setupPIN: (pin: string) => Promise<boolean>;
  verifyPIN: (pin: string) => Promise<boolean>;
  changePIN: (oldPin: string, newPin: string) => Promise<boolean>;
  setBiometricsEnabled: (enabled: boolean) => Promise<boolean>;
  refreshSecurityState: () => Promise<void>;
}

const WalletSecurityContext = createContext<WalletSecurityContextValue | undefined>(undefined);

export function WalletSecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [securityState, setSecurityState] = useState<WalletSecurityRecord | null>(null);
  const [isLockedByBruteForce, setIsLockedByBruteForce] = useState<boolean>(false);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(0);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);

  // Sync unlock status from sessionStorage on client load
  useEffect(() => {
    if (!user) {
      setIsUnlocked(false);
      return;
    }
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`goflazz_unlocked_${user.id}`);
      setIsUnlocked(stored === "true");
    }
  }, [user]);

  // Fetch security record & check brute-force status
  const refreshSecurityState = useCallback(async () => {
    if (!user) {
      setSecurityState(null);
      setIsLockedByBruteForce(false);
      setRemainingLockSeconds(0);
      setLockedUntil(null);
      setFailedAttempts(0);
      return;
    }

    try {
      const secData = await SecurityService.getWalletSecurity(user.id);
      setSecurityState(secData);
      setFailedAttempts(secData?.pin_attempts || 0);

      const lockStatus = await SecurityService.checkBruteForceLock(user.id);
      if (lockStatus.isLocked) {
        setIsLockedByBruteForce(true);
        setRemainingLockSeconds(lockStatus.remainingSeconds);
        setLockedUntil(lockStatus.lockedUntil);
      } else {
        setIsLockedByBruteForce(false);
        setRemainingLockSeconds(0);
        setLockedUntil(null);
      }
    } catch (err) {
      console.error("[WalletSecurityProvider.refreshSecurityState]", err);
    }
  }, [user]);

  useEffect(() => {
    refreshSecurityState();
  }, [refreshSecurityState]);

  // Countdown timer when locked
  useEffect(() => {
    if (!isLockedByBruteForce || remainingLockSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingLockSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLockedByBruteForce(false);
          setLockedUntil(null);
          setFailedAttempts(0);
          if (user) {
            SecurityService.resetPinAttempts(user.id).catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedByBruteForce, remainingLockSeconds, user]);

  /**
   * Unlock wallet with 6-digit PIN
   */
  const unlockWallet = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No authenticated user session." };

    // Check brute force lock
    const lockCheck = await SecurityService.checkBruteForceLock(user.id);
    if (lockCheck.isLocked) {
      setIsLockedByBruteForce(true);
      setRemainingLockSeconds(lockCheck.remainingSeconds);
      setLockedUntil(lockCheck.lockedUntil);
      const minutes = Math.ceil(lockCheck.remainingSeconds / 60);
      return {
        success: false,
        error: `Wallet locked. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      };
    }

    const secData = await SecurityService.getWalletSecurity(user.id);
    if (!secData || !secData.pin_hash) {
      return { success: false, error: "No PIN setup found for this wallet." };
    }

    try {
      const isValid = await SecurityService.verifyPin(user.id, pin);

      if (isValid) {
        await SecurityService.resetPinAttempts(user.id);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`goflazz_unlocked_${user.id}`, "true");
        }
        setIsUnlocked(true);
        setIsLockedByBruteForce(false);
        setFailedAttempts(0);
        setRemainingLockSeconds(0);
        setLockedUntil(null);
        await refreshSecurityState();
        return { success: true };
      } else {
        const { nextAttempts, lockedUntil: newLockTime } = await SecurityService.recordFailedAttempt(
          user.id,
          secData.pin_attempts || 0
        );
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5 || newLockTime) {
          setIsLockedByBruteForce(true);
          const remainingSecs = 15 * 60; // 15 minutes lock
          setRemainingLockSeconds(remainingSecs);
          setLockedUntil(newLockTime || new Date(Date.now() + 15 * 60 * 1000).toISOString());
          return {
            success: false,
            error: "Too many failed attempts. Your wallet is locked for 15 minutes.",
          };
        }

        const remainingAttempts = 5 - nextAttempts;
        return {
          success: false,
          error: `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`,
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "An error occurred during verification." };
    }
  };

  /**
   * Prepared Architecture Hook for Biometric Unlock
   */
  const unlockWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No authenticated user." };

    if (!securityState?.biometrics_enabled) {
      return { success: false, error: "Biometrics is not enabled in settings." };
    }

    // Check brute force lock
    if (isLockedByBruteForce) {
      return { success: false, error: "Wallet is locked due to too many failed PIN attempts." };
    }

    try {
      // Prepared extension point for WebAuthn credential assertion
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        // Biometric assertion check extension point
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`goflazz_unlocked_${user.id}`, "true");
        }
        setIsUnlocked(true);
        return { success: true };
      } else {
        return { success: false, error: "Biometric hardware is not available on this device." };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Biometric unlock failed." };
    }
  };

  /**
   * Lock wallet session
   */
  const lockWallet = () => {
    if (user && typeof window !== "undefined") {
      sessionStorage.removeItem(`goflazz_unlocked_${user.id}`);
    }
    setIsUnlocked(false);
  };

  /**
   * Setup a new PIN
   */
  const setupPIN = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      toast.error("PIN must be exactly 6 digits.");
      return false;
    }
    if (COMMON_PINS.includes(pin)) {
      toast.error("This PIN is too common. Please select a stronger PIN.");
      return false;
    }

    try {
      await SecurityService.upsertPIN(user.id, pin);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`goflazz_unlocked_${user.id}`, "true");
      }
      setIsUnlocked(true);
      await refreshSecurityState();
      return true;
    } catch (err: any) {
      toast.error("Failed setting up PIN: " + err.message);
      return false;
    }
  };

  /**
   * Verify PIN standalone
   */
  const verifyPIN = async (pin: string): Promise<boolean> => {
    const res = await unlockWallet(pin);
    return res.success;
  };

  /**
   * Change PIN & re-encrypt wallet keys
   */
  const changePIN = async (oldPin: string, newPin: string): Promise<boolean> => {
    if (!user) return false;
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      toast.error("New PIN must be exactly 6 digits.");
      return false;
    }
    if (COMMON_PINS.includes(newPin)) {
      toast.error("This PIN is too common. Please select a stronger PIN.");
      return false;
    }

    try {
      await WalletService.changePin(user.id, oldPin, newPin);
      await refreshSecurityState();
      toast.success("Security PIN updated and wallets re-encrypted.");
      return true;
    } catch (err: any) {
      toast.error("Failed to change PIN: " + err.message);
      return false;
    }
  };

  /**
   * Toggle Biometrics
   */
  const setBiometricsEnabled = async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    try {
      await SecurityService.setBiometricsEnabled(user.id, enabled);
      await refreshSecurityState();
      return true;
    } catch (err: any) {
      toast.error("Failed updating biometric status: " + err.message);
      return false;
    }
  };

  const isBiometricsSupported = securityState?.biometrics_supported ?? false;
  const isBiometricsEnabled = securityState?.biometrics_enabled ?? false;
  const canUnlockWithBiometrics = isBiometricsSupported && isBiometricsEnabled;

  return (
    <WalletSecurityContext.Provider
      value={{
        isUnlocked,
        isLockedByBruteForce,
        remainingLockSeconds,
        lockedUntil,
        failedAttempts,
        securityState,
        isBiometricsEnabled,
        isBiometricsSupported,
        canUnlockWithBiometrics,
        unlockWallet,
        unlockWithBiometrics,
        lockWallet,
        setupPIN,
        verifyPIN,
        changePIN,
        setBiometricsEnabled,
        refreshSecurityState,
      }}
    >
      {children}
    </WalletSecurityContext.Provider>
  );
}

export function useWalletSecurityContext() {
  const context = useContext(WalletSecurityContext);
  if (!context) {
    throw new Error("useWalletSecurityContext must be used within a WalletSecurityProvider");
  }
  return context;
}
