"use client";

import { useWalletSecurityContext } from "@/context/WalletSecurityContext";

export { WalletSecurityProvider, useWalletSecurityContext } from "@/context/WalletSecurityContext";

export function useWalletSecurity() {
  const security = useWalletSecurityContext();
  return {
    securityState: security.securityState,
    fetchSecurityState: security.refreshSecurityState,
    setupPIN: security.setupPIN,
    verifyPIN: security.verifyPIN,
    changePIN: security.changePIN,
    setBiometricsEnabled: security.setBiometricsEnabled,
    isUnlocked: security.isUnlocked,
    unlockWallet: security.unlockWallet,
    unlockWithBiometrics: security.unlockWithBiometrics,
    lockWallet: security.lockWallet,
    isLockedByBruteForce: security.isLockedByBruteForce,
    remainingLockSeconds: security.remainingLockSeconds,
    failedAttempts: security.failedAttempts,
    canUnlockWithBiometrics: security.canUnlockWithBiometrics,
  };
}


