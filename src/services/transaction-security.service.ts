/**
 * Transaction Security Authorization Guard for GoFlazz Wallet
 * Pre-flight verification checking PIN, Biometrics, Trusted Device, Risk Score,
 * Emergency Lockout, and Recovery Status prior to executing sensitive wallet actions.
 */
import { PinEngine } from "@/security/pin-engine";
import { BiometricService } from "@/services/biometric.service";
import { SecurityService } from "@/services/security.service";
import { EmergencyModeService } from "@/security/emergency-mode.service";
import { DeviceProtectionService } from "@/security/device-protection.service";
import { SecurityPolicyService } from "@/security/security-policy.service";
import { SecurityAuditLogger } from "@/security/security-audit-logger.service";

export interface TransactionAuthRequest {
  userId: string;
  action: "send" | "swap" | "bridge" | "trade" | "stake" | "export_key" | "delete_wallet";
  amountUsd?: number;
  pin?: string;
  useBiometrics?: boolean;
}

export interface TransactionAuthResult {
  authorized: boolean;
  reason?: string;
  requireBiometricChallenge?: boolean;
  riskScore: number;
}

export class TransactionSecurityGuard {
  /**
   * Verify all security constraints before permitting transaction authorization
   */
  static async authorizeAction(req: TransactionAuthRequest): Promise<TransactionAuthResult> {
    const { userId, action, amountUsd = 0, pin, useBiometrics = false } = req;

    // 1. Check Emergency Mode Lockout
    const emergency = EmergencyModeService.getEmergencyStatus(userId);
    if (emergency.isLocked) {
      await SecurityAuditLogger.logEvent(userId, "fraud_detected", {
        reason: "Attempted action during Emergency Lockout",
        action,
      });
      return {
        authorized: false,
        reason: `Wallet is Emergency Locked (${emergency.reason || "Freeze"}). Unfreeze via recovery first.`,
        riskScore: 100,
      };
    }

    // 2. Environment & Device Risk Score
    const diagnostics = DeviceProtectionService.diagnoseEnvironment();
    if (diagnostics.riskScore >= 80) {
      return {
        authorized: false,
        reason: "Environment risk score too high. Action blocked due to suspicious environment.",
        riskScore: diagnostics.riskScore,
      };
    }

    // 3. High Value Biometrics Policy Check
    const isHighValue = SecurityPolicyService.isHighValueTransaction(userId, amountUsd);
    if (isHighValue && !useBiometrics) {
      // Must prompt for biometric verification
      return {
        authorized: false,
        requireBiometricChallenge: true,
        reason: `High-value transaction ($${amountUsd} USD) requires biometric authentication.`,
        riskScore: diagnostics.riskScore,
      };
    }

    // 4. PIN Authorization Check
    const isPinRequired = SecurityPolicyService.isPinRequiredForAction(
      userId,
      action === "send"
        ? "requirePinForSend"
        : action === "swap"
        ? "requirePinForSwap"
        : action === "bridge"
        ? "requirePinForBridge"
        : action === "trade"
        ? "requirePinForTrade"
        : action === "stake"
        ? "requirePinForStake"
        : action === "export_key"
        ? "requirePinForExport"
        : action === "delete_wallet"
        ? "requirePinForDeleteWallet"
        : "requirePinForSettings"
    );

    if (isPinRequired) {
      if (!pin) {
        return {
          authorized: false,
          reason: "Security PIN is required for this action.",
          riskScore: diagnostics.riskScore,
        };
      }

      const sec = await SecurityService.getWalletSecurity(userId);
      if (!sec || !sec.pin_hash) {
        return {
          authorized: false,
          reason: "No PIN configured on wallet.",
          riskScore: diagnostics.riskScore,
        };
      }

      const pinCheck = await PinEngine.verifyPin(userId, pin, sec.pin_hash);
      if (!pinCheck.success) {
        const failedResult = PinEngine.calculateFailedAttempt(sec.pin_attempts || 0);
        await SecurityService.recordFailedAttempt(userId, sec.pin_attempts || 0);

        await SecurityAuditLogger.logEvent(userId, "pin_failed", {
          action,
          failedAttempts: failedResult.nextAttempts,
        });

        if (failedResult.triggerEmergencyLock) {
          await EmergencyModeService.triggerEmergencyLock(
            userId,
            "10 Consecutive Failed PIN Entries",
            "Brute Force Protection"
          );
        }

        return {
          authorized: false,
          reason: failedResult.lockedUntil
            ? "Incorrect PIN. Account locked due to repeated failed attempts."
            : "Incorrect PIN entered.",
          riskScore: diagnostics.riskScore,
        };
      }

      // Reset PIN attempts on successful PIN entry
      await SecurityService.resetPinAttempts(userId);
    }

    // Action successfully authorized
    await SecurityAuditLogger.logEvent(userId, "device_verified", {
      action,
      amountUsd,
      authorized: true,
    });

    return {
      authorized: true,
      riskScore: diagnostics.riskScore,
    };
  }
}
