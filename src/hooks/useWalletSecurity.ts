"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SecurityService, WalletSecurityRecord } from "@/services/security.service";
import { WalletService } from "@/services/wallet.service";
import { toast } from "sonner";

const COMMON_PINS = [
  "123456", "654321", "000000", "111111", "222222", 
  "333333", "444444", "555555", "666666", "777777", 
  "888888", "999999", "121212", "343434", "565656"
];

export function useWalletSecurity() {
  const { user } = useAuth();
  const [securityState, setSecurityState] = useState<WalletSecurityRecord | null>(null);

  const fetchSecurityState = useCallback(async () => {
    if (!user) {
      setSecurityState(null);
      return;
    }
    const secData = await SecurityService.getWalletSecurity(user.id);
    setSecurityState(secData);
  }, [user]);

  const setupPIN = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    if (pin.length < 6 || !/^\d+$/.test(pin)) {
      toast.error("PIN must be exactly 6 digits.");
      return false;
    }
    if (COMMON_PINS.includes(pin)) {
      toast.error("This PIN is too common. Please select a stronger PIN.");
      return false;
    }

    try {
      await SecurityService.upsertPIN(user.id, pin);
      await fetchSecurityState();
      return true;
    } catch (err: any) {
      toast.error("Failed to setup PIN: " + err.message);
      return false;
    }
  };

  const verifyPIN = async (pin: string): Promise<boolean> => {
    if (!user) return false;

    const lockCheck = await SecurityService.checkBruteForceLock(user.id);
    if (lockCheck.isLocked) {
      toast.error(`Wallet is temporarily locked due to too many failed attempts. Try again in ${lockCheck.remainingSeconds}s.`);
      return false;
    }

    const secData = await SecurityService.getWalletSecurity(user.id);
    if (!secData?.pin_hash) {
      toast.error("No PIN is configured yet.");
      return false;
    }

    try {
      const isValid = await SecurityService.verifyPin(user.id, pin);

      if (isValid) {
        await SecurityService.resetPinAttempts(user.id);
        await fetchSecurityState();
        return true;
      } else {
        const { nextAttempts } = await SecurityService.recordFailedAttempt(user.id, secData.pin_attempts || 0);
        if (nextAttempts >= 5) {
          toast.error("Too many failed attempts. Your wallet access is locked for 15 minutes.");
        } else {
          toast.error(`Incorrect PIN. ${5 - nextAttempts} attempts remaining.`);
        }
        await fetchSecurityState();
        return false;
      }
    } catch (err: any) {
      toast.error("Failed to verify PIN: " + err.message);
      return false;
    }
  };

  const changePIN = async (oldPin: string, newPin: string): Promise<boolean> => {
    if (!user) return false;
    if (newPin.length < 6 || !/^\d+$/.test(newPin)) {
      toast.error("New PIN must be exactly 6 digits.");
      return false;
    }
    if (COMMON_PINS.includes(newPin)) {
      toast.error("This PIN is too common. Please select a stronger PIN.");
      return false;
    }

    try {
      await WalletService.changePin(user.id, oldPin, newPin);
      await fetchSecurityState();
      toast.success("Security PIN updated and wallets re-encrypted.");
      return true;
    } catch (err: any) {
      toast.error("Failed to change PIN: " + err.message);
      return false;
    }
  };

  const setBiometricsEnabled = async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    try {
      await SecurityService.setBiometricsEnabled(user.id, enabled);
      await fetchSecurityState();
      return true;
    } catch (err: any) {
      toast.error("Failed updating biometric status: " + err.message);
      return false;
    }
  };

  return {
    securityState,
    fetchSecurityState,
    setupPIN,
    verifyPIN,
    changePIN,
    setBiometricsEnabled,
  };
}

