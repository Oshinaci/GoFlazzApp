/**
 * Security Alert Engine for GoFlazz Wallet
 * Dispatches real-time security alerts and notifications for security-critical events
 * such as PIN changes, exports, new devices, and emergency locks.
 */
import { NotificationsService } from "@/services/notifications.service";
import { SecurityAuditEventType } from "@/types/security-engine";

export type SecurityAlertCategory =
  | "NEW_LOGIN"
  | "NEW_DEVICE"
  | "PIN_CHANGED"
  | "WALLET_EXPORT"
  | "RECOVERY_PHRASE_VIEWED"
  | "BIOMETRIC_DISABLED"
  | "RECOVERY_STARTED"
  | "EMERGENCY_LOCK";

export interface SecurityAlertItem {
  id: string;
  userId: string;
  category: SecurityAlertCategory;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
  read: boolean;
}

export class AlertEngineService {
  private static STORAGE_KEY = "goflazz_security_alerts";

  /**
   * Dispatch security alert
   */
  static async triggerAlert(
    userId: string,
    category: SecurityAlertCategory,
    details?: Record<string, any>
  ): Promise<SecurityAlertItem> {
    const alertMeta = this.buildAlertMeta(category, details);
    const now = new Date().toISOString();

    const alertItem: SecurityAlertItem = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      category,
      title: alertMeta.title,
      message: alertMeta.message,
      severity: alertMeta.severity,
      createdAt: now,
      read: false,
    };

    // Store in localStorage
    if (typeof window !== "undefined") {
      const existing = this.getAlerts(userId);
      existing.unshift(alertItem);
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(existing.slice(0, 50)));
    }

    // Trigger Notification Service
    try {
      NotificationsService.addNotification(
        alertMeta.severity === "critical" ? "security" : "system",
        alertMeta.title,
        alertMeta.message,
        "/settings"
      );
    } catch (_) {}

    return alertItem;
  }

  /**
   * Retrieve security alerts for user
   */
  static getAlerts(userId: string): SecurityAlertItem[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (_) {
      return [];
    }
  }

  private static buildAlertMeta(
    category: SecurityAlertCategory,
    details?: Record<string, any>
  ): { title: string; message: string; severity: "info" | "warning" | "critical" } {
    switch (category) {
      case "NEW_LOGIN":
        return {
          title: "New Session Detected",
          message: `A new session was authenticated on ${details?.deviceName || "a browser device"}.`,
          severity: "info",
        };
      case "NEW_DEVICE":
        return {
          title: "New Device Linked",
          message: `Your account was accessed from new device ${details?.deviceName || "Unknown Device"}.`,
          severity: "warning",
        };
      case "PIN_CHANGED":
        return {
          title: "Wallet PIN Updated",
          message: "Your 6-digit Security PIN was successfully changed.",
          severity: "warning",
        };
      case "WALLET_EXPORT":
        return {
          title: "CRITICAL: Private Key Exported",
          message: "Your wallet private key or seed phrase was accessed and exported.",
          severity: "critical",
        };
      case "RECOVERY_PHRASE_VIEWED":
        return {
          title: "Recovery Phrase Displayed",
          message: "Secret recovery seed phrase was unmasked on screen.",
          severity: "critical",
        };
      case "BIOMETRIC_DISABLED":
        return {
          title: "Biometrics Disabled",
          message: "Biometric authentication was disabled for your wallet.",
          severity: "warning",
        };
      case "RECOVERY_STARTED":
        return {
          title: "Account Recovery Initiated",
          message: "Emergency wallet recovery verification process was started.",
          severity: "critical",
        };
      case "EMERGENCY_LOCK":
        return {
          title: "EMERGENCY: Wallet Locked",
          message: "Emergency Mode triggered. All transactions and key exports are frozen.",
          severity: "critical",
        };
      default:
        return {
          title: "Security Notice",
          message: "A security action was performed on your account.",
          severity: "info",
        };
    }
  }
}
