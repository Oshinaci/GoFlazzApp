/**
 * Security Policy Manager for GoFlazz Wallet
 * Manages policy rules requiring PIN / Biometrics for operations like
 * key exports, transfers, swaps, bridges, staking, and setting changes.
 */
import { SecurityPolicyConfig } from "@/types/security-engine";

export class SecurityPolicyService {
  private static STORAGE_KEY = "goflazz_security_policy";

  private static defaultPolicy: SecurityPolicyConfig = {
    requirePinForExport: true,
    requirePinForSend: true,
    requirePinForSwap: true,
    requirePinForBridge: true,
    requirePinForTrade: true,
    requirePinForStake: true,
    requirePinForDeleteWallet: true,
    requirePinForSettings: true,
    requireBiometricForHighValueUsd: 500, // $500 USD threshold
  };

  /**
   * Get active security policy configuration
   */
  static getPolicy(userId: string): SecurityPolicyConfig {
    if (typeof window === "undefined") return this.defaultPolicy;
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
    if (!stored) return this.defaultPolicy;
    try {
      return { ...this.defaultPolicy, ...JSON.parse(stored) };
    } catch (_) {
      return this.defaultPolicy;
    }
  }

  /**
   * Update policy configuration
   */
  static updatePolicy(userId: string, update: Partial<SecurityPolicyConfig>): SecurityPolicyConfig {
    const current = this.getPolicy(userId);
    const updated = { ...current, ...update };
    if (typeof window !== "undefined") {
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(updated));
    }
    return updated;
  }

  /**
   * Check if action requires PIN verification based on policy
   */
  static isPinRequiredForAction(
    userId: string,
    action: keyof Omit<SecurityPolicyConfig, "requireBiometricForHighValueUsd">
  ): boolean {
    const policy = this.getPolicy(userId);
    return policy[action] ?? true;
  }

  /**
   * Check if transaction amount exceeds high-value threshold requiring biometric approval
   */
  static isHighValueTransaction(userId: string, amountUsd: number): boolean {
    const policy = this.getPolicy(userId);
    if (!policy.requireBiometricForHighValueUsd) return false;
    return amountUsd >= policy.requireBiometricForHighValueUsd;
  }
}
