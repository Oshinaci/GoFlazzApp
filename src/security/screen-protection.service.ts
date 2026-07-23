/**
 * Screen Protection Service for GoFlazz Wallet
 * Handles auto-blur protection on app minimize/blur, sensitive key mask toggling,
 * copy prevention, and screenshot mitigation.
 */

export class ScreenProtectionService {
  private static isPrivacyOverlayActive = false;
  private static listenersAttached = false;
  private static onStateChangeCallback: ((isBlurred: boolean) => void) | null = null;

  /**
   * Initialize screen protection listeners
   */
  static init(onStateChange?: (isBlurred: boolean) => void): void {
    if (typeof window === "undefined" || this.listenersAttached) return;

    if (onStateChange) {
      this.onStateChangeCallback = onStateChange;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        this.setPrivacyOverlay(true);
      } else {
        this.setPrivacyOverlay(false);
      }
    };

    const handleWindowBlur = () => {
      this.setPrivacyOverlay(true);
    };

    const handleWindowFocus = () => {
      this.setPrivacyOverlay(false);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    this.listenersAttached = true;
  }

  /**
   * Enable/disable privacy backdrop overlay
   */
  static setPrivacyOverlay(active: boolean): void {
    if (this.isPrivacyOverlayActive === active) return;
    this.isPrivacyOverlayActive = active;

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(active);
    }
  }

  /**
   * Check if privacy overlay is currently active
   */
  static isBlurred(): boolean {
    return this.isPrivacyOverlayActive;
  }

  /**
   * Mask sensitive string (e.g. private key, seed phrase, or account address)
   */
  static maskSensitiveString(str: string, keepFirst = 4, keepLast = 4): string {
    if (!str) return "••••••••";
    if (str.length <= keepFirst + keepLast) {
      return "••••••••";
    }
    return `${str.slice(0, keepFirst)}••••••••${str.slice(-keepLast)}`;
  }

  /**
   * Mask currency balances
   */
  static maskBalance(valueFormatted: string, isHidden: boolean): string {
    if (isHidden) return "••••••";
    return valueFormatted;
  }
}
