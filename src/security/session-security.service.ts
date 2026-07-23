/**
 * Session Security Service for GoFlazz Wallet
 * Manages device fingerprints, active sessions, session verification,
 * single device logout, logout all devices, and trusted sessions registry.
 */
import { SecuritySessionItem, TrustedDeviceItem } from "@/types/security-engine";
import { supabase, safeStringify } from "@/lib/supabaseClient";

export class SessionSecurityService {
  private static STORAGE_KEY_SESSIONS = "goflazz_security_sessions";
  private static STORAGE_KEY_DEVICES = "goflazz_trusted_devices";

  /**
   * Generate stable device fingerprint ID for current browser session
   */
  static getDeviceId(): string {
    if (typeof window === "undefined") return "server_device";
    let devId = localStorage.getItem("goflazz_device_id");
    if (!devId) {
      devId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("goflazz_device_id", devId);
    }
    return devId;
  }

  /**
   * Get active sessions for user
   */
  static async getActiveSessions(userId: string): Promise<SecuritySessionItem[]> {
    if (typeof window === "undefined") return [];

    const currentDeviceId = this.getDeviceId();
    const stored = localStorage.getItem(`${this.STORAGE_KEY_SESSIONS}_${userId}`);
    let sessions: SecuritySessionItem[] = [];

    if (stored) {
      try {
        sessions = JSON.parse(stored);
      } catch (_) {}
    }

    // Default current session if empty
    if (sessions.length === 0) {
      const currentSession: SecuritySessionItem = {
        id: `sess_curr_${currentDeviceId}`,
        userId,
        deviceId: currentDeviceId,
        deviceName: this.getDeviceName(),
        browser: this.getBrowserName(),
        ipAddress: "127.0.0.1 (Local)",
        location: "Current Device Location",
        isCurrentSession: true,
        isTrusted: true,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      sessions = [currentSession];
      localStorage.setItem(`${this.STORAGE_KEY_SESSIONS}_${userId}`, safeStringify(sessions));
    } else {
      // Mark current session
      sessions = sessions.map((s) => ({
        ...s,
        isCurrentSession: s.deviceId === currentDeviceId,
      }));
    }

    return sessions;
  }

  /**
   * Register or refresh current session
   */
  static async registerCurrentSession(userId: string): Promise<SecuritySessionItem> {
    const deviceId = this.getDeviceId();
    const sessions = await this.getActiveSessions(userId);

    const existingIndex = sessions.findIndex((s) => s.deviceId === deviceId);
    const now = new Date().toISOString();

    let updatedSession: SecuritySessionItem;

    if (existingIndex >= 0) {
      updatedSession = {
        ...sessions[existingIndex],
        lastActiveAt: now,
        isCurrentSession: true,
      };
      sessions[existingIndex] = updatedSession;
    } else {
      updatedSession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        deviceId,
        deviceName: this.getDeviceName(),
        browser: this.getBrowserName(),
        ipAddress: "Current Connection",
        location: "Local Connection",
        isCurrentSession: true,
        isTrusted: true,
        createdAt: now,
        lastActiveAt: now,
      };
      sessions.push(updatedSession);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(`${this.STORAGE_KEY_SESSIONS}_${userId}`, safeStringify(sessions));
    }

    return updatedSession;
  }

  /**
   * Revoke a single session by session ID
   */
  static async revokeSession(userId: string, sessionId: string): Promise<SecuritySessionItem[]> {
    let sessions = await this.getActiveSessions(userId);
    sessions = sessions.filter((s) => s.id !== sessionId);

    if (typeof window !== "undefined") {
      localStorage.setItem(`${this.STORAGE_KEY_SESSIONS}_${userId}`, safeStringify(sessions));
    }

    return sessions;
  }

  /**
   * Revoke all other sessions except current device
   */
  static async revokeAllOtherSessions(userId: string): Promise<SecuritySessionItem[]> {
    const currentDeviceId = this.getDeviceId();
    let sessions = await this.getActiveSessions(userId);
    sessions = sessions.filter((s) => s.deviceId === currentDeviceId);

    if (typeof window !== "undefined") {
      localStorage.setItem(`${this.STORAGE_KEY_SESSIONS}_${userId}`, safeStringify(sessions));
    }

    return sessions;
  }

  /**
   * Get trusted devices for user
   */
  static async getTrustedDevices(userId: string): Promise<TrustedDeviceItem[]> {
    if (typeof window === "undefined") return [];

    const currentDeviceId = this.getDeviceId();
    const stored = localStorage.getItem(`${this.STORAGE_KEY_DEVICES}_${userId}`);
    let devices: TrustedDeviceItem[] = [];

    if (stored) {
      try {
        devices = JSON.parse(stored);
      } catch (_) {}
    }

    if (devices.length === 0) {
      const defaultDevice: TrustedDeviceItem = {
        id: `dev_rec_${currentDeviceId}`,
        userId,
        deviceId: currentDeviceId,
        deviceName: this.getDeviceName(),
        model: navigator.platform || "Browser Platform",
        os: this.getOperatingSystem(),
        registeredAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isCurrentDevice: true,
      };
      devices = [defaultDevice];
      localStorage.setItem(`${this.STORAGE_KEY_DEVICES}_${userId}`, safeStringify(devices));
    } else {
      devices = devices.map((d) => ({
        ...d,
        isCurrentDevice: d.deviceId === currentDeviceId,
      }));
    }

    return devices;
  }

  /**
   * Register current device as trusted device
   */
  static async registerTrustedDevice(userId: string, credentialId?: string): Promise<TrustedDeviceItem[]> {
    const devices = await this.getTrustedDevices(userId);
    const currentDeviceId = this.getDeviceId();
    const now = new Date().toISOString();

    const existingIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
    if (existingIndex >= 0) {
      devices[existingIndex].lastSeenAt = now;
      if (credentialId) devices[existingIndex].credentialId = credentialId;
    } else {
      devices.push({
        id: `dev_${Date.now()}`,
        userId,
        deviceId: currentDeviceId,
        deviceName: this.getDeviceName(),
        model: navigator.platform || "Platform",
        os: this.getOperatingSystem(),
        credentialId,
        registeredAt: now,
        lastSeenAt: now,
        isCurrentDevice: true,
      });
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(`${this.STORAGE_KEY_DEVICES}_${userId}`, safeStringify(devices));
    }

    return devices;
  }

  private static getDeviceName(): string {
    if (typeof window === "undefined") return "Server Node";
    const ua = navigator.userAgent || "";
    if (/iPhone/i.test(ua)) return "Apple iPhone";
    if (/iPad/i.test(ua)) return "Apple iPad";
    if (/Macintosh/i.test(ua)) return "MacBook / iMac";
    if (/Android/i.test(ua)) return "Android Device";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Linux/i.test(ua)) return "Linux Workstation";
    return "Web Workstation";
  }

  private static getBrowserName(): string {
    if (typeof window === "undefined") return "Node Runtime";
    const ua = navigator.userAgent || "";
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "Google Chrome";
    if (/Edg/i.test(ua)) return "Microsoft Edge";
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Apple Safari";
    if (/Firefox/i.test(ua)) return "Mozilla Firefox";
    return "Browser App";
  }

  private static getOperatingSystem(): string {
    if (typeof window === "undefined") return "Linux";
    const ua = navigator.userAgent || "";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown OS";
  }
}
