/**
 * Auto Lock Engine for GoFlazz Wallet
 * Tracks user activity, auto-locks wallet on inactivity or app minimization,
 * supports configurable timeouts (Immediate, 30s, 1m, 5m, 15m, 30m, Manual).
 */
import { AutoLockOption } from "@/types/security-engine";

export class AutoLockEngine {
  private static lockTimeoutSecondsMap: Record<AutoLockOption, number> = {
    immediate: 0,
    "30s": 30,
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    manual: -1, // Never auto-lock on timer
  };

  private static lastActivityTimestamp = Date.now();
  private static currentOption: AutoLockOption = "5m";
  private static isLockedState = false;
  private static timerId: any = null;
  private static onLockStateChangeCallback: ((isLocked: boolean) => void) | null = null;
  private static listenersBound = false;

  /**
   * Convert auto lock option to timeout seconds
   */
  static getTimeoutSeconds(option: AutoLockOption): number {
    return this.lockTimeoutSecondsMap[option] ?? 300;
  }

  /**
   * Configure auto-lock policy and start monitoring
   */
  static init(option: AutoLockOption, onLockStateChange?: (isLocked: boolean) => void): void {
    if (typeof window === "undefined") return;

    this.currentOption = option;
    if (onLockStateChange) {
      this.onLockStateChangeCallback = onLockStateChange;
    }

    this.resetActivity();
    this.bindActivityListeners();
    this.startInactivityTimer();
  }

  /**
   * Reset activity timestamp
   */
  static resetActivity(): void {
    this.lastActivityTimestamp = Date.now();
  }

  /**
   * Trigger manual lock immediately
   */
  static lockNow(): void {
    this.isLockedState = true;
    if (this.onLockStateChangeCallback) {
      this.onLockStateChangeCallback(true);
    }
  }

  /**
   * Unlock after successful PIN/Biometrics verification
   */
  static unlock(): void {
    this.isLockedState = false;
    this.resetActivity();
    if (this.onLockStateChangeCallback) {
      this.onLockStateChangeCallback(false);
    }
  }

  /**
   * Get current locked status
   */
  static isLocked(): boolean {
    return this.isLockedState;
  }

  /**
   * Check if inactivity period exceeds current setting
   */
  static checkInactivityTimeout(): boolean {
    if (this.isLockedState) return true;
    if (this.currentOption === "manual") return false;

    const timeoutSec = this.getTimeoutSeconds(this.currentOption);
    if (timeoutSec === 0) {
      // Immediate lock mode
      return false;
    }

    const elapsedMs = Date.now() - this.lastActivityTimestamp;
    if (elapsedMs >= timeoutSec * 1000) {
      this.lockNow();
      return true;
    }
    return false;
  }

  /**
   * Bind DOM user interaction events to track activity
   */
  private static bindActivityListeners(): void {
    if (this.listenersBound || typeof window === "undefined") return;

    const handleUserInteraction = () => {
      this.resetActivity();
    };

    window.addEventListener("mousemove", handleUserInteraction, { passive: true });
    window.addEventListener("keydown", handleUserInteraction, { passive: true });
    window.addEventListener("touchstart", handleUserInteraction, { passive: true });
    window.addEventListener("pointerdown", handleUserInteraction, { passive: true });
    window.addEventListener("scroll", handleUserInteraction, { passive: true });

    // Backgrounding / minimization check
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        if (this.currentOption === "immediate") {
          this.lockNow();
        }
      }
    });

    this.listenersBound = true;
  }

  /**
   * Start interval loop checking inactivity
   */
  private static startInactivityTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.checkInactivityTimeout();
    }, 5000);
  }
}
