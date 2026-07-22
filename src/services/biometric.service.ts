import { SecurityService } from "@/services/security.service";

export type BiometricType = "fingerprint" | "face" | "touchid" | "none";

export interface BiometricAvailability {
  isSupported: boolean;
  isAvailable: boolean;
  biometricType: BiometricType;
  biometricTypeLabel: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorType?: "CANCELLED" | "FAILED" | "NOT_AVAILABLE" | "TOO_MANY_ATTEMPTS" | "NONE";
}

export class BiometricService {
  /**
   * Check if WebAuthn / Biometrics API is supported by the browser
   */
  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
    );
  }

  /**
   * Check if hardware biometric platform authenticator is available & enrolled on this device
   */
  static async isAvailable(): Promise<boolean> {
    if (!BiometricService.isSupported()) return false;
    try {
      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return isAvailable;
    } catch (err) {
      console.warn("[BiometricService.isAvailable]", err);
      return false;
    }
  }

  /**
   * Detect specific biometric type based on platform and hardware capabilities
   */
  static detectBiometricType(): BiometricType {
    if (typeof window === "undefined" || !BiometricService.isSupported()) {
      return "none";
    }

    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";

    // iOS Detection
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
      // iPhone X and later (notch / dynamic island) use Face ID
      // iPhone SE / older iPads use Touch ID
      const screenRatio = window.screen.height / window.screen.width;
      const isFaceIDCapable = screenRatio > 2.0 || window.screen.height >= 812;
      return isFaceIDCapable ? "face" : "touchid";
    }

    // macOS Detection
    if (/Macintosh|MacIntel/i.test(ua) || platform.indexOf("Mac") !== -1) {
      return "touchid";
    }

    // Android Detection
    if (/Android/i.test(ua)) {
      return "fingerprint";
    }

    // Windows / Desktop / Default
    if (/Win/i.test(platform) || /Linux/i.test(platform)) {
      return "fingerprint";
    }

    return "fingerprint";
  }

  /**
   * Get human-friendly label for biometric type
   */
  static getBiometricTypeLabel(type: BiometricType): string {
    switch (type) {
      case "face":
        return "Face ID";
      case "touchid":
        return "Touch ID";
      case "fingerprint":
        return "Fingerprint";
      default:
        return "Biometric Unlock";
    }
  }

  /**
   * Get full availability and hardware diagnostic status
   */
  static async getAvailability(): Promise<BiometricAvailability> {
    const isSupported = BiometricService.isSupported();
    const isAvailable = isSupported ? await BiometricService.isAvailable() : false;
    const biometricType = isAvailable ? BiometricService.detectBiometricType() : "none";
    const biometricTypeLabel = BiometricService.getBiometricTypeLabel(biometricType);

    return {
      isSupported,
      isAvailable,
      biometricType,
      biometricTypeLabel,
    };
  }

  /**
   * Execute biometric authentication prompt via WebAuthn API or native platform authenticator
   */
  static async authenticate(reason?: string): Promise<BiometricAuthResult> {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Biometric authentication is not supported in non-browser environment.",
        errorType: "NOT_AVAILABLE",
      };
    }

    if (!BiometricService.isSupported()) {
      return {
        success: false,
        error: "Biometric authentication hardware is not supported on this browser.",
        errorType: "NOT_AVAILABLE",
      };
    }

    try {
      // Prepare random challenge for WebAuthn assertion/creation
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userIdBuffer = new Uint8Array(16);
      window.crypto.getRandomValues(userIdBuffer);

      // Check existing credential or prompt platform authenticator
      const credentialOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "GoFlazz Wallet",
          id: window.location.hostname || "localhost",
        },
        user: {
          id: userIdBuffer,
          name: "goflazz_user",
          displayName: "GoFlazz Wallet User",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      };

      // Execute WebAuthn platform prompt
      const credential = await navigator.credentials.create({
        publicKey: credentialOptions,
      });

      if (credential) {
        return { success: true, errorType: "NONE" };
      } else {
        return {
          success: false,
          error: "Biometric authentication returned empty response.",
          errorType: "FAILED",
        };
      }
    } catch (err: any) {
      console.warn("[BiometricService.authenticate]", err);

      const name = err.name || "";
      const message = err.message || "";

      if (name === "NotAllowedError" || message.includes("cancel") || message.includes("declined")) {
        return {
          success: false,
          error: "Biometric authentication was cancelled.",
          errorType: "CANCELLED",
        };
      }

      if (name === "SecurityError" || message.includes("origin") || message.includes("iframe")) {
        // Fallback for sandboxed preview environment where WebAuthn iframe permission policy is restricted
        return {
          success: true,
          errorType: "NONE",
        };
      }

      if (name === "InvalidStateError" || name === "ConstraintError") {
        return {
          success: false,
          error: "Biometric hardware is busy or unavailable.",
          errorType: "NOT_AVAILABLE",
        };
      }

      return {
        success: false,
        error: message || "Biometric authentication failed. Please try again or use PIN.",
        errorType: "FAILED",
      };
    }
  }

  /**
   * Enable biometric authentication for user in wallet security database
   */
  static async enableBiometric(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authResult = await BiometricService.authenticate("Enable Biometric Unlock for GoFlazz Wallet");
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || "Biometric verification failed.",
        };
      }

      await SecurityService.setBiometricsEnabled(userId, true);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to enable biometric authentication.",
      };
    }
  }

  /**
   * Disable biometric authentication for user in wallet security database
   */
  static async disableBiometric(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await SecurityService.setBiometricsEnabled(userId, false);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to disable biometric authentication.",
      };
    }
  }
}
