import { supabase } from "@/lib/supabaseClient";

export interface WalletBalanceRecord {
  id: string;
  user_id: string;
  wallet_id: string | null;
  asset_symbol: string;
  balance: number;
  token_address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class BalanceService {
  /**
   * Fetch balances for a wallet
   */
  static async getBalances(userId: string, walletId?: string): Promise<WalletBalanceRecord[]> {
    let query = supabase.from("wallet_balances").select("*").eq("user_id", userId);
    if (walletId) {
      query = query.eq("wallet_id", walletId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[BalanceService.getBalances]", error);
      return [];
    }

    return (data || []) as WalletBalanceRecord[];
  }

  /**
   * Upsert a balance record
   */
  static async upsertBalance(userId: string, walletId: string, assetSymbol: string, balance: number, tokenAddress?: string): Promise<void> {
    const { error } = await supabase
      .from("wallet_balances")
      .upsert({
        user_id: userId,
        wallet_id: walletId,
        asset_symbol: assetSymbol,
        balance,
        token_address: tokenAddress || null,
      }, { onConflict: "wallet_id,asset_symbol" });

    if (error) {
      console.error("[BalanceService.upsertBalance]", error);
    }
  }
}
