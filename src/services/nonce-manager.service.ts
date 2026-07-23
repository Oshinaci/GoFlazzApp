/**
 * Enterprise Nonce Manager for GoFlazz
 * Handles pending nonces, RPC state, local sequence tracking, synchronization, and conflict resolution.
 */
import { ChainId } from "@/types/blockchain";
import { ProviderManager } from "@/providers/provider-manager";
import { blockchainCache } from "@/lib/blockchain-cache";
import { blockchainLogger } from "@/lib/blockchain-logger";

class NonceManagerServiceClass {
  private localNonces: Map<string, number> = new Map();

  private getMapKey(chainId: ChainId, address: string): string {
    return `${chainId}_${address.toLowerCase()}`;
  }

  /**
   * Get the next valid nonce for a wallet address on a specific chain
   */
  async getNextNonce(chainId: ChainId, address: string): Promise<number> {
    const key = this.getMapKey(chainId, address);
    
    try {
      const provider = await ProviderManager.getProvider(chainId);
      const rpcNonce = await provider.getTransactionCount(address, "pending");

      const currentLocal = this.localNonces.get(key);

      // Conflict Resolution: Use whichever is higher (RPC pending vs tracked local queue)
      let targetNonce = rpcNonce;
      if (currentLocal !== undefined && currentLocal >= rpcNonce) {
        targetNonce = currentLocal;
      }

      this.localNonces.set(key, targetNonce + 1);
      blockchainLogger.log("tx_prep", "info", `Assigned nonce ${targetNonce} for ${address} on chain ${chainId}`);
      return targetNonce;
    } catch (err: any) {
      blockchainLogger.log("tx_prep", "error", `Failed to fetch nonce for ${address} on chain ${chainId}`, err?.message);
      
      const fallback = this.localNonces.get(key) || 0;
      this.localNonces.set(key, fallback + 1);
      return fallback;
    }
  }

  /**
   * Reset or synchronize local nonce with the network
   */
  async syncNonce(chainId: ChainId, address: string): Promise<number> {
    const key = this.getMapKey(chainId, address);
    try {
      const provider = await ProviderManager.getProvider(chainId);
      const rpcNonce = await provider.getTransactionCount(address, "latest");
      this.localNonces.set(key, rpcNonce);
      return rpcNonce;
    } catch {
      return this.localNonces.get(key) || 0;
    }
  }

  /**
   * Clear tracked nonce for address
   */
  clearAddressNonce(chainId: ChainId, address: string) {
    const key = this.getMapKey(chainId, address);
    this.localNonces.delete(key);
  }

  /**
   * Register a nonce that was successfully broadcast
   */
  registerUsedNonce(address: string, chainId: ChainId, nonce: number, txHash?: string) {
    const key = this.getMapKey(chainId, address);
    const currentLocal = this.localNonces.get(key) || 0;
    if (nonce >= currentLocal) {
      this.localNonces.set(key, nonce + 1);
    }
  }
}


export const NonceManagerService = new NonceManagerServiceClass();
