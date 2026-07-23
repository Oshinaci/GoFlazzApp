/**
 * Security Center Service for GoFlazz Wallet
 * Calculates Security Score (0-100), Risk Score (0-100), tracks Backup Status,
 * and compiles comprehensive Security Dashboard diagnostic data.
 */
import {
  SecurityScoreBreakdown,
  TrustedDeviceItem,
  SecuritySessionItem,
  SecurityAuditEvent,
} from "@/types/security-engine";
import { SecurityService } from "@/services/security.service";
import { SessionSecurityService } from "@/security/session-security.service";
import { DeviceProtectionService } from "@/security/device-protection.service";
import { EmergencyModeService } from "@/security/emergency-mode.service";
import { SecurityAuditLogger } from "@/security/security-audit-logger.service";

export interface SecurityDashboardData {
  securityScore: SecurityScoreBreakdown;
  riskScore: number;
  emergencyLocked: boolean;
  trustedDevices: TrustedDeviceItem[];
  activeSessions: SecuritySessionItem[];
  recentEvents: SecurityAuditEvent[];
  backupStatus: {
    isBackedUp: boolean;
    lastBackupDate: string | null;
  };
}

export class SecurityCenterService {
  /**
   * Compute comprehensive security score breakdown
   */
  static async computeSecurityScore(userId: string): Promise<SecurityScoreBreakdown> {
    const sec = await SecurityService.getWalletSecurity(userId);
    const settings = await SecurityService.getSecuritySettings(userId);
    const devices = await SessionSecurityService.getTrustedDevices(userId);
    const diagnostics = DeviceProtectionService.diagnoseEnvironment();

    // 1. PIN Set Score (25)
    const pinSetScore = sec?.pin_hash ? 25 : 0;

    // 2. Biometrics Enabled (20)
    const biometricsScore = sec?.biometrics_enabled ? 20 : 0;

    // 3. Auto Lock Setting Score (15)
    let autoLockScore = 10; // Default
    if (settings) {
      if (settings.auto_lock_minutes <= 1) autoLockScore = 15;
      else if (settings.auto_lock_minutes <= 5) autoLockScore = 12;
      else if (settings.auto_lock_minutes <= 15) autoLockScore = 8;
    }

    // 4. Backup Status Score (20)
    // Check if recovery phrase backup verified
    const isBackedUp = typeof window !== "undefined" && localStorage.getItem(`backup_verified_${userId}`) === "true";
    const backupScore = isBackedUp ? 20 : 5;

    // 5. Trusted Device Score (10)
    const trustedDeviceScore = devices.length > 0 ? 10 : 5;

    // 6. Low Environment Risk Score (10)
    const lowRiskScore = diagnostics.riskScore < 20 ? 10 : diagnostics.riskScore < 50 ? 5 : 0;

    const totalScore = pinSetScore + biometricsScore + autoLockScore + backupScore + trustedDeviceScore + lowRiskScore;

    let grade: SecurityScoreBreakdown["grade"] = "F";
    if (totalScore >= 90) grade = "A+";
    else if (totalScore >= 80) grade = "A";
    else if (totalScore >= 70) grade = "B";
    else if (totalScore >= 55) grade = "C";
    else if (totalScore >= 40) grade = "D";

    return {
      pinSetScore,
      biometricsScore,
      autoLockScore,
      backupScore,
      trustedDeviceScore,
      lowRiskScore,
      totalScore,
      grade,
    };
  }

  /**
   * Get full dashboard security metrics
   */
  static async getDashboardData(userId: string): Promise<SecurityDashboardData> {
    const securityScore = await this.computeSecurityScore(userId);
    const diagnostics = DeviceProtectionService.diagnoseEnvironment();
    const emergencyStatus = EmergencyModeService.getEmergencyStatus(userId);
    const trustedDevices = await SessionSecurityService.getTrustedDevices(userId);
    const activeSessions = await SessionSecurityService.getActiveSessions(userId);
    const recentEvents = SecurityAuditLogger.getLogs(userId).slice(0, 10);

    const isBackedUp = typeof window !== "undefined" && localStorage.getItem(`backup_verified_${userId}`) === "true";
    const lastBackupDate = typeof window !== "undefined" ? localStorage.getItem(`backup_date_${userId}`) : null;

    return {
      securityScore,
      riskScore: diagnostics.riskScore,
      emergencyLocked: emergencyStatus.isLocked,
      trustedDevices,
      activeSessions,
      recentEvents,
      backupStatus: {
        isBackedUp,
        lastBackupDate,
      },
    };
  }
}
