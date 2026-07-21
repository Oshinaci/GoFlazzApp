import { supabase } from "@/lib/supabaseClient";

export interface ActivityLogRecord {
  id: string;
  user_id: string;
  action: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export interface WalletActivityRecord {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  action: string;
  type?: string | null;
  amount?: number | null;
  symbol?: string | null;
  counterparty?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export class ActivityService {
  /**
   * Fetch activity logs for a user
   */
  static async getActivityLogs(userId: string): Promise<WalletActivityRecord[]> {
    const { data, error } = await supabase
      .from("wallet_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ActivityService.getActivityLogs]", error);
      return [];
    }

    return (data || []) as WalletActivityRecord[];
  }

  /**
   * Log an activity event
   */
  static async logActivity(userId: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await Promise.allSettled([
      supabase.from("activity_logs").insert({
        user_id: userId,
        action,
        metadata,
      }),
      supabase.from("wallet_activity").insert({
        user_id: userId,
        action,
        metadata,
      }),
    ]);
  }
}
