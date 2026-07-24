import { WalletRepository, WalletDbRecord } from "./wallet.repository";
import { WalletSyncService } from "./walletSync";
import { WalletBalanceRecord } from "../balance.service";

export class WalletEngineService {
  /**
   * Get all wallets for user
   */
  static async getUserWallets(userId: string): Promise<WalletDbRecord[]> {
    return WalletRepository.getWallets(userId);
  }

  /**
   * Synchronize wallet with Arbitrum One blockchain (Read-only)
   */
  static async syncWallet(userId: string, walletId: string, walletAddress: string, networkId: string = "arbitrum"): Promise<WalletBalanceRecord[]> {
    return WalletSyncService.syncBalances(userId, walletId, walletAddress, networkId);
  }
}
