"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SecurityService, WalletSecurityRecord } from "@/services/security.service";
import { hashPin } from "@/lib/encryption";
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
      const pin_hash = await hashPin(pin, user.id);
      await SecurityService.upsertPIN(user.id, pin_hash);
      await fetchSecurityState();
      return true;
    } catch (err: any) {
      toast.error("Failed to setup PIN: " + err.message);
      return false;
    }
  };

  const verifyPIN = async (pin: string): Promise<boolean> => {
    if (!user) return false;

    const secData = await SecurityService.getWalletSecurity(user.id);

    if (secData?.locked_until) {
      const lockTime = new Date(secData.locked_until).getTime();
      const now = new Date().getTime();
      if (now < lockTime) {
        const remainingSecs = Math.ceil((lockTime - now) / 1000);
        toast.error(`Wallet is temporarily locked due to too many attempts. Try again in ${remainingSecs}s.`);
        return false;
      }
    }

    try {
      const inputHash = await hashPin(pin, user.id);
      const storedHash = secData?.pin_hash;

      if (!storedHash) {
        toast.error("No PIN is configured yet.");
        return false;
      }

      if (inputHash === storedHash) {
        await SecurityService.resetPinAttempts(user.id);
        await fetchSecurityState();
        return true;
      } else {
        const { nextAttempts } = await SecurityService.recordFailedAttempt(user.id, secData?.pin_attempts || 0);
        if (nextAttempts >= 5) {
          toast.error("Too many failed attempts. Your wallet access is locked for 5 minutes.");
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
    setBiometricsEnabled,
  };
}
