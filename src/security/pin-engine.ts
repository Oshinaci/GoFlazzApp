/**
 * Production-Ready PIN Engine for GoFlazz Wallet
 * Handles 6-digit numeric PIN validation, PBKDF2/SHA-256 secure hashing with per-user salt,
 * constant-time comparisons, progressive failed attempt counters, lockout timers, and emergency locks.
 */
import { hashPin, constantTimeCompare } from "@/lib/encryption";
import { supabase, safeStringify } from "@/lib/supabaseClient";

export interface PinState {
  userId: string;
  pinHash: string;
  failedAttempts: number;
  lockedUntil: string | null;
  emergencyLocked: boolean;
  updatedAt: string;
}

export class PinEngine {
  private static MAX_ATTEMPTS_BEFORE_LOCK = 5;
  private static MAX_ATTEMPTS_BEFORE_EMERGENCY_LOCK = 10;
  private static LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes

  /**
   * Validate that PIN is strictly 6 digits
   */
  static validatePinFormat(pin: string): { valid: boolean; error?: string } {
    if (!pin) {
      return { valid: false, error: "PIN is required" };
    }
    if (!/^\d{6}$/.test(pin)) {
      return { valid: false, error: "PIN must be exactly 6 numeric digits" };
    }
    // Reject weak repeated patterns
    if (/^(\d)\1{5}$/.test(pin)) {
      return { valid: false, error: "PIN cannot be repeated digits (e.g. 111111)" };
    }
    if ("012345 123456 234567 345678 456789 987654 876543 765432 654321 543210".includes(pin)) {
      return { valid: false, error: "PIN cannot be sequential digits (e.g. 123456)" };
    }
    return { valid: true };
  }

  /**
   * Compute PIN hash with per-user salt
   */
  static async hashPin(pin: string, userId: string): Promise<string> {
    const check = this.validatePinFormat(pin);
    if (!check.valid) {
      throw new Error(check.error);
    }
    return await hashPin(pin, userId);
  }

  /**
   * Verify entered PIN against user's stored PIN state
   */
  static async verifyPin(
    userId: string,
    inputPin: string,
    storedPinHash: string
  ): Promise<{ success: boolean; isLocked: boolean; remainingSeconds: number }> {
    // 1. Validate format
    const format = this.validatePinFormat(inputPin);
    if (!format.valid) {
      return { success: false, isLocked: false, remainingSeconds: 0 };
    }

    // 2. Hash input
    const inputHash = await this.hashPin(inputPin, userId);

    // 3. Constant-time compare
    const match = constantTimeCompare(inputHash, storedPinHash);

    return {
      success: match,
      isLocked: false,
      remainingSeconds: 0,
    };
  }

  /**
   * Check if PIN attempts have resulted in a lockout
   */
  static isLockedOut(lockedUntil: string | null): { isLocked: boolean; remainingSeconds: number } {
    if (!lockedUntil) return { isLocked: false, remainingSeconds: 0 };

    const lockTime = new Date(lockedUntil).getTime();
    const now = Date.now();

    if (now < lockTime) {
      const remainingSeconds = Math.ceil((lockTime - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }

    return { isLocked: false, remainingSeconds: 0 };
  }

  /**
   * Record a failed PIN attempt and return updated state with progressive lockout calculation
   */
  static calculateFailedAttempt(
    currentAttempts: number
  ): { nextAttempts: number; lockedUntil: string | null; triggerEmergencyLock: boolean } {
    const nextAttempts = currentAttempts + 1;
    let lockedUntil: string | null = null;
    let triggerEmergencyLock = false;

    if (nextAttempts >= this.MAX_ATTEMPTS_BEFORE_EMERGENCY_LOCK) {
      triggerEmergencyLock = true;
      lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 Hours
    } else if (nextAttempts >= this.MAX_ATTEMPTS_BEFORE_LOCK) {
      lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS).toISOString(); // 15 Minutes
    }

    return {
      nextAttempts,
      lockedUntil,
      triggerEmergencyLock,
    };
  }
}
