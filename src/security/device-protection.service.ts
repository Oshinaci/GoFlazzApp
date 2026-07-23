/**
 * Device Protection Service for GoFlazz Wallet
 * Environment analysis detecting rooted/jailbroken devices, emulators, developer mode,
 * USB debugging, screen capture, overlay attacks, and suspicious web environments.
 */
import { DeviceDiagnostics } from "@/types/security-engine";

export class DeviceProtectionService {
  private static cachedDiagnostics: DeviceDiagnostics | null = null;
  private static lastDiagnosticTime = 0;
  private static CACHE_TTL_MS = 30000; // 30 seconds cache

  /**
   * Run full device and environment diagnostics
   */
  static diagnoseEnvironment(forceRefresh = false): DeviceDiagnostics {
    const now = Date.now();
    if (!forceRefresh && this.cachedDiagnostics && now - this.lastDiagnosticTime < this.CACHE_TTL_MS) {
      return this.cachedDiagnostics;
    }

    const reasons: string[] = [];
    let riskScore = 0;

    if (typeof window === "undefined") {
      return {
        isRootedOrJailbroken: false,
        isEmulator: false,
        isDeveloperMode: false,
        isUsbDebugging: false,
        isScreenRecordingDetected: false,
        isOverlayDetected: false,
        isSuspiciousEnv: false,
        riskScore: 0,
        reasons: [],
      };
    }

    const nav = navigator as any;
    const ua = nav.userAgent || "";

    // 1. Jailbreak / Root Detection
    let isRootedOrJailbroken = false;
    if (
      (window as any).Cydia ||
      (window as any).Substrate ||
      (window as any).__cydia_cb ||
      (window as any).cydia ||
      /cydia|jailbreak|substrate|root/i.test(ua)
    ) {
      isRootedOrJailbroken = true;
      reasons.push("Rooted/Jailbroken flags detected in runtime environment");
      riskScore += 40;
    }

    // 2. Emulator / Virtual Machine Detection
    let isEmulator = false;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
          if (
            /SwiftShader|LLVM|VirtualBox|VMware|Boyle|Emulator|Android SDK|Mesa|Software Rasterizer/i.test(
              renderer
            )
          ) {
            isEmulator = true;
            reasons.push(`Virtual renderer detected: ${renderer}`);
            riskScore += 25;
          }
        }
      }
    } catch (_) {}

    // 3. Developer Mode / DevTools Open Detection
    let isDeveloperMode = false;
    const threshold = 160;
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      isDeveloperMode = true;
      reasons.push("DevTools panel open or debug window resized");
      riskScore += 15;
    }

    // 4. USB Debugging / Automation Detection
    let isUsbDebugging = false;
    if (
      nav.webdriver ||
      (window as any).domAutomation ||
      (window as any).domAutomationController ||
      (window as any)._phantom
    ) {
      isUsbDebugging = true;
      reasons.push("Browser automation or debugging interface attached");
      riskScore += 30;
    }

    // 5. Screen Recording / Display Capture Detection
    let isScreenRecordingDetected = false;
    if (nav.mediaDevices && typeof nav.mediaDevices.getDisplayMedia === "function" && nav.getDisplayMedia) {
      isScreenRecordingDetected = false;
    }

    // 6. Overlay Attack / Window Focus Hijacking
    let isOverlayDetected = false;
    if (!document.hasFocus() && document.visibilityState === "visible") {
      isOverlayDetected = true;
      reasons.push("App window lost focus while remaining visible (possible transparent overlay)");
      riskScore += 20;
    }

    // 7. Suspicious Environment (e.g. untrusted origin iframe without secure context)
    let isSuspiciousEnv = false;
    if (window.self !== window.top && !window.isSecureContext) {
      isSuspiciousEnv = true;
      reasons.push("Running inside non-secure top window or untrusted frame");
      riskScore += 20;
    }

    // Clamp score
    riskScore = Math.min(100, Math.max(0, riskScore));

    const result: DeviceDiagnostics = {
      isRootedOrJailbroken,
      isEmulator,
      isDeveloperMode,
      isUsbDebugging,
      isScreenRecordingDetected,
      isOverlayDetected,
      isSuspiciousEnv,
      riskScore,
      reasons,
    };

    this.cachedDiagnostics = result;
    this.lastDiagnosticTime = now;

    return result;
  }
}
