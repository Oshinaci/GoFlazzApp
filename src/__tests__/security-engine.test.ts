/**
 * GoFlazz Security Engine Integration Test Suite
 * Tests PIN security, lockout rules, fraud scoring, auto-lock timeouts,
 * emergency mode controls, screen protection masking, and transaction guard authorization.
 */
import { PinEngine } from "@/security/pin-engine";
import { DeviceProtectionService } from "@/security/device-protection.service";
import { ScreenProtectionService } from "@/security/screen-protection.service";
import { AutoLockEngine } from "@/security/auto-lock.service";
import { FraudDetectionService } from "@/security/fraud-detection.service";
import { SecurityCenterService } from "@/security/security-center.service";
import { EmergencyModeService } from "@/security/emergency-mode.service";
import { TransactionSecurityGuard } from "@/services/transaction-security.service";

describe("GoFlazz Security Engine Test Suite", () => {
  describe("1. PIN Engine", () => {
    it("should accept valid 6-digit numeric PINs", () => {
      const res = PinEngine.validatePinFormat("849201");
      expect(res.valid).toBe(true);
    });

    it("should reject non-6-digit PINs", () => {
      expect(PinEngine.validatePinFormat("12345").valid).toBe(false);
      expect(PinEngine.validatePinFormat("1234567").valid).toBe(false);
      expect(PinEngine.validatePinFormat("abc123").valid).toBe(false);
    });

    it("should reject sequential or repeated PINs", () => {
      expect(PinEngine.validatePinFormat("111111").valid).toBe(false);
      expect(PinEngine.validatePinFormat("123456").valid).toBe(false);
    });

    it("should calculate progressive lockouts for failed PIN entries", () => {
      const attempt1 = PinEngine.calculateFailedAttempt(0);
      expect(attempt1.nextAttempts).toBe(1);
      expect(attempt1.lockedUntil).toBeNull();
      expect(attempt1.triggerEmergencyLock).toBe(false);

      const attempt5 = PinEngine.calculateFailedAttempt(4);
      expect(attempt5.nextAttempts).toBe(5);
      expect(attempt5.lockedUntil).not.toBeNull();
      expect(attempt5.triggerEmergencyLock).toBe(false);

      const attempt10 = PinEngine.calculateFailedAttempt(9);
      expect(attempt10.nextAttempts).toBe(10);
      expect(attempt10.triggerEmergencyLock).toBe(true);
    });
  });

  describe("2. Screen Protection & Masking", () => {
    it("should correctly mask sensitive strings and account addresses", () => {
      const addr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      const masked = ScreenProtectionService.maskSensitiveString(addr, 6, 4);
      expect(masked).toBe("0x71C7••••••••976F");
    });

    it("should hide balance when privacy is enabled", () => {
      const balance = "$12,450.00";
      expect(ScreenProtectionService.maskBalance(balance, true)).toBe("••••••");
      expect(ScreenProtectionService.maskBalance(balance, false)).toBe("$12,450.00");
    });
  });

  describe("3. Auto Lock Engine", () => {
    it("should return correct timeout seconds for options", () => {
      expect(AutoLockEngine.getTimeoutSeconds("immediate")).toBe(0);
      expect(AutoLockEngine.getTimeoutSeconds("30s")).toBe(30);
      expect(AutoLockEngine.getTimeoutSeconds("1m")).toBe(60);
      expect(AutoLockEngine.getTimeoutSeconds("5m")).toBe(300);
      expect(AutoLockEngine.getTimeoutSeconds("15m")).toBe(900);
      expect(AutoLockEngine.getTimeoutSeconds("manual")).toBe(-1);
    });
  });

  describe("4. Fraud Detection Service", () => {
    it("should trigger elevated risk score on repeated failed PIN attempts", async () => {
      const res = await FraudDetectionService.evaluateFraudRisk({
        userId: "test_user_1",
        actionType: "pin_entry",
        failedAttemptsCount: 4,
      });

      expect(res.riskScore).toBeGreaterThanOrEqual(50);
      expect(res.triggeredRules.length).toBeGreaterThan(0);
    });
  });

  describe("5. Emergency Mode Service", () => {
    it("should block operations and throw error when emergency locked", async () => {
      const userId = "emergency_test_user";
      await EmergencyModeService.triggerEmergencyLock(userId, "Testing Emergency Mode", "Jest Test");

      expect(() => {
        EmergencyModeService.assertNotLocked(userId);
      }).toThrow();

      await EmergencyModeService.releaseEmergencyLock(userId);
      expect(() => {
        EmergencyModeService.assertNotLocked(userId);
      }).not.toThrow();
    });
  });

  describe("6. Transaction Security Guard", () => {
    it("should reject transactions when wallet is emergency locked", async () => {
      const userId = "guard_test_user";
      await EmergencyModeService.triggerEmergencyLock(userId, "Security Breach", "Guard Test");

      const auth = await TransactionSecurityGuard.authorizeAction({
        userId,
        action: "send",
        amountUsd: 100,
      });

      expect(auth.authorized).toBe(false);
      expect(auth.reason).toContain("Emergency Locked");

      await EmergencyModeService.releaseEmergencyLock(userId);
    });
  });
});
