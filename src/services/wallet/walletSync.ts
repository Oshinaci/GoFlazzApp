import { BalanceFetcherService, FetchedBalance } from "./balanceFetcher";
import { TokenDiscoveryService } from "./tokenDiscovery";
import { BalanceService, WalletBalanceRecord } from "../balance.service";

export class WalletSyncService {
  /**
   * Syncs real blockchain balances for a wallet and caches them in the database.
   */
  static async syncBalances(userId: string, walletId: string, walletAddress: string, networkId: string): Promise<WalletBalanceRecord[]> {
    try {
      const knownTokens = TokenDiscoveryService.getKnownTokens(networkId);
      const fetchedBalances = await BalanceFetcherService.getBalances(walletAddress, networkId, knownTokens);

      const records: WalletBalanceRecord[] = fetchedBalances.map((fb) => ({
        id: `${walletId}_${fb.symbol}`, // temp id for UI if needed
        user_id: userId,
        wallet_id: walletId,
        asset_symbol: fb.symbol,
        balance: fb.balance,
        token_address: fb.address,
      }));

      // Cache asynchronously to Supabase so the UI isn't blocked by DB writes
      Promise.all(
        fetchedBalances.map(async (fb) => {
          try {
            await BalanceService.upsertBalance(userId, walletId, fb.symbol, fb.balance, fb.address || undefined);
          } catch (e) {
            console.error(`Failed to cache balance for ${fb.symbol}`, e);
          }
        })
      ).catch(console.error);

      return records;
    } catch (error) {
      console.error("[WalletSyncService] Failed to sync balances:", error);
      throw error;
    }
  }
}
