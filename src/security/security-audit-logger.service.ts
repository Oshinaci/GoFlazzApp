/**
 * Security Audit Logger for GoFlazz Wallet
 * Records immutable security audit logs to database and local store.
 */
import { SecurityAuditEvent, SecurityAuditEventType } from "@/types/security-engine";
import { supabase, safeStringify } from "@/lib/supabaseClient";

export class SecurityAuditLogger {
  private static STORAGE_KEY = "goflazz_security_audit_logs";

  /**
   * Log security event
   */
  static async logEvent(
    userId: string,
    action: SecurityAuditEventType,
    metadata: Record<string, any> = {}
  ): Promise<SecurityAuditEvent> {
    const event: SecurityAuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      action,
      metadata: {
        ...metadata,
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
        timestamp: Date.now(),
      },
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    if (typeof window !== "undefined") {
      const logs = this.getLogs(userId);
      logs.unshift(event);
      localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, safeStringify(logs.slice(0, 100)));
    }

    // Persist to Supabase if available
    try {
      await supabase.from("security_logs").insert({
        user_id: userId,
        action,
        details: safeStringify(event.metadata),
        ip_address: metadata.ipAddress || "127.0.0.1",
        created_at: event.createdAt,
      });
    } catch (_) {}

    return event;
  }

  /**
   * Fetch audit logs for user
   */
  static getLogs(userId: string): SecurityAuditEvent[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (_) {
      return [];
    }
  }
}
