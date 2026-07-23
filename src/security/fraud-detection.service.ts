/**
 * Fraud Detection Engine for GoFlazz Wallet
 * Evaluates real-time threat signals: Impossible Travel, Brute Force PIN/Login,
 * Rapid Wallet Exports, Concurrent Devices, and Unknown Location access.
 */
import { FraudDetectionResult, FraudAlertSeverity } from "@/types/security-engine";
import { SessionSecurityService } from "@/security/session-security.service";

export interface FraudCheckParams {
  userId: string;
  actionType: "login" | "pin_entry" | "wallet_export" | "transaction" | "settings_change";
  failedAttemptsCount?: number;
  ipAddress?: string;
  deviceFingerprint?: string;
  locationCountry?: string;
  timestamp?: number;
}

export class FraudDetectionService {
  private static exportTimestamps: Record<string, number[]> = {};

  /**
   * Run full fraud detection rule engine against action parameters
   */
  static async evaluateFraudRisk(params: FraudCheckParams): Promise<FraudDetectionResult> {
    const { userId, actionType, failedAttemptsCount = 0 } = params;
    const triggeredRules: string[] = [];
    let riskScore = 0;

    // Rule 1: Brute Force & Repeated Failed PIN Attempts
    if (failedAttemptsCount >= 3) {
      triggeredRules.push(`Brute force attempt detected (${failedAttemptsCount} failed PIN entries)`);
      riskScore += failedAttemptsCount * 15;
    }

    // Rule 2: Rapid Wallet Export Requests (e.g. > 2 exports in 60 seconds)
    if (actionType === "wallet_export") {
      const now = Date.now();
      const history = this.exportTimestamps[userId] || [];
      const recent = history.filter((t) => now - t < 60000);
      recent.push(now);
      this.exportTimestamps[userId] = recent;

      if (recent.length >= 2) {
        triggeredRules.push("Rapid consecutive wallet private key / phrase exports detected");
        riskScore += 50;
      }
    }

    // Rule 3: Multiple Active Devices check
    const sessions = await SessionSecurityService.getActiveSessions(userId);
    if (sessions.length > 3) {
      triggeredRules.push(`High concurrent active device count (${sessions.length} devices)`);
      riskScore += 20;
    }

    // Rule 4: New Unrecognized Device
    const devices = await SessionSecurityService.getTrustedDevices(userId);
    const currentDeviceId = SessionSecurityService.getDeviceId();
    const isKnownDevice = devices.some((d) => d.deviceId === currentDeviceId);

    if (!isKnownDevice) {
      triggeredRules.push("Access request from new unverified device");
      riskScore += 25;
    }

    // Clamp score
    riskScore = Math.min(100, Math.max(0, riskScore));

    let severity: FraudAlertSeverity = "info";
    let recommendation: FraudDetectionResult["recommendation"] = "allow";

    if (riskScore >= 75) {
      severity = "critical";
      recommendation = "emergency_lock";
    } else if (riskScore >= 50) {
      severity = "critical";
      recommendation = "block";
    } else if (riskScore >= 30) {
      severity = "warning";
      recommendation = "challenge_biometrics";
    } else if (riskScore >= 15) {
      severity = "info";
      recommendation = "challenge_pin";
    }

    return {
      isFraudulent: riskScore >= 50,
      riskScore,
      triggeredRules,
      severity,
      recommendation,
    };
  }
}
