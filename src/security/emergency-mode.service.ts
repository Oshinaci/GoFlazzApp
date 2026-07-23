/**
 * Emergency Mode Service for GoFlazz Wallet
 * Freeze wallet operations, disables transfers, swaps, bridges, and key exports,
 * requiring emergency recovery verification to unfreeze.
 */
import { EmergencyStatus } from "@/types/security-engine";
import { AlertEngineService } from "@/security/alert-engine.service";

export class EmergencyModeService {
  private static STORAGE_KEY = "goflazz_emergency_status";

  /**
   * Get emergency status
   */
  static getEmergencyStatus(userId: string): EmergencyStatus {
    if (typeof window === "undefined") {
      return {
        isLocked: false,
        reason: null,
        lockedAt: null,
        lockedBy: null,
        requiresRecoveryVerification: false,
      };
    }

    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
    if (!stored) {
      return {
        isLocked: false,
        reason: null,
        lockedAt: null,
        lockedBy: null,
        requiresRecoveryVerification: false,
      };
    }

    try {
      return JSON.parse(stored);
    } catch (_) {
      return {
        isLocked: false,
        reason: null,
        lockedAt: null,
        lockedBy: null,
        requiresRecoveryVerification: false,
      };
    }
  }

  /**
   * Trigger emergency lock (freeze wallet)
   */
  static async triggerEmergencyLock(
    userId: string,
    reason: string = "Manual Security Lockdown Triggered",
    lockedBy: string = "User"
  ): Promise<EmergencyStatus> {
    const status: EmergencyStatus = {
      isLocked: true,
      reason,
      lockedAt: new Date().toISOString(),
      lockedBy,
      requiresRecoveryVerification: true,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(status));
    }

    // Trigger alert
    await AlertEngineService.triggerAlert(userId, "EMERGENCY_LOCK", { reason, lockedBy });

    return status;
  }

  /**
   * Release emergency lock after successful recovery phrase verification
   */
  static async releaseEmergencyLock(userId: string): Promise<EmergencyStatus> {
    const status: EmergencyStatus = {
      isLocked: false,
      reason: null,
      lockedAt: null,
      lockedBy: null,
      requiresRecoveryVerification: false,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(status));
    }

    return status;
  }

  /**
   * Assert that emergency mode is inactive, throw error if active
   */
  static assertNotLocked(userId: string): void {
    const status = this.getEmergencyStatus(userId);
    if (status.isLocked) {
      throw new Error(
        `Wallet is currently Emergency Frozen (${status.reason || "Lockdown"}). All transactions and exports are disabled.`
      );
    }
  }
}
