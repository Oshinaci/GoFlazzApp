/**
 * Enterprise Security Engine Type Definitions for GoFlazz Wallet
 */

export type AutoLockOption = "immediate" | "30s" | "1m" | "5m" | "15m" | "30m" | "manual";

export interface SecurityScoreBreakdown {
  pinSetScore: number; // 25 max
  biometricsScore: number; // 20 max
  autoLockScore: number; // 15 max
  backupScore: number; // 20 max
  trustedDeviceScore: number; // 10 max
  lowRiskScore: number; // 10 max
  totalScore: number; // 100 max
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
}

export interface DeviceDiagnostics {
  isRootedOrJailbroken: boolean;
  isEmulator: boolean;
  isDeveloperMode: boolean;
  isUsbDebugging: boolean;
  isScreenRecordingDetected: boolean;
  isOverlayDetected: boolean;
  isSuspiciousEnv: boolean;
  riskScore: number; // 0 to 100
  reasons: string[];
}

export interface SecuritySessionItem {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  isCurrentSession: boolean;
  isTrusted: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface TrustedDeviceItem {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  model: string;
  os: string;
  credentialId?: string;
  registeredAt: string;
  lastSeenAt: string;
  isCurrentDevice: boolean;
}

export type FraudAlertSeverity = "info" | "warning" | "critical";

export interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: number; // 0 to 100
  triggeredRules: string[];
  severity: FraudAlertSeverity;
  recommendation: "allow" | "challenge_pin" | "challenge_biometrics" | "block" | "emergency_lock";
}

export type SecurityAuditEventType =
  | "pin_created"
  | "pin_changed"
  | "pin_failed"
  | "pin_lockout"
  | "biometric_enabled"
  | "biometric_disabled"
  | "session_revoked"
  | "session_logout_all"
  | "emergency_lock_triggered"
  | "emergency_lock_released"
  | "device_verified"
  | "fraud_detected"
  | "security_score_updated"
  | "screen_protection_triggered";

export interface SecurityAuditEvent {
  id?: string;
  userId: string;
  action: SecurityAuditEventType;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface SecurityPolicyConfig {
  requirePinForExport: boolean;
  requirePinForSend: boolean;
  requirePinForSwap: boolean;
  requirePinForBridge: boolean;
  requirePinForTrade: boolean;
  requirePinForStake: boolean;
  requirePinForDeleteWallet: boolean;
  requirePinForSettings: boolean;
  requireBiometricForHighValueUsd: number; // Threshold in USD (e.g. $500)
}

export interface EmergencyStatus {
  isLocked: boolean;
  reason: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  requiresRecoveryVerification: boolean;
}
