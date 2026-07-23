import { JsonRpcProvider } from "ethers";
import { ChainId, RpcHealthStatus } from "@/types/blockchain";
import { SUPPORTED_NETWORKS } from "@/lib/networks";
import { blockchainLogger } from "@/lib/blockchain-logger";

class RpcManager {
  private providers: Map<ChainId, { primary: JsonRpcProvider; backup: JsonRpcProvider }> = new Map();
  private healthStatus: Map<ChainId, RpcHealthStatus> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    for (const chainIdStr of Object.keys(SUPPORTED_NETWORKS)) {
      const chainId = Number(chainIdStr) as ChainId;
      const net = SUPPORTED_NETWORKS[chainId];
      try {
        const primary = new JsonRpcProvider(net.rpcUrls.primary, chainId);
        const backup = new JsonRpcProvider(net.rpcUrls.backup, chainId);
        this.providers.set(chainId, { primary, backup });

        this.healthStatus.set(chainId, {
          chainId,
          rpcUrl: net.rpcUrls.primary,
          isHealthy: true,
          latencyMs: 0,
          lastChecked: new Date().toISOString(),
          errorCount: 0,
        });
      } catch (err: any) {
        blockchainLogger.log('rpc', 'error', `Failed to initialize providers for chain ${chainId}`, err?.message);
      }
    }
  }

  /**
   * Get provider with automatic failover and latency measurement
   */
  async getProvider(chainId: ChainId): Promise<JsonRpcProvider> {
    const pair = this.providers.get(chainId);
    if (!pair) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const startTime = Date.now();
    try {
      // Test primary provider connectivity with getBlockNumber
      await pair.primary.getBlockNumber();
      const latency = Date.now() - startTime;
      this.updateHealth(chainId, pair.primary._getConnection().url, true, latency);
      return pair.primary;
    } catch (primaryErr: any) {
      blockchainLogger.log('rpc', 'warn', `Primary RPC failed for chain ${chainId}, switching to backup`, primaryErr?.message);
      try {
        const backupStartTime = Date.now();
        await pair.backup.getBlockNumber();
        const backupLatency = Date.now() - backupStartTime;
        this.updateHealth(chainId, pair.backup._getConnection().url, true, backupLatency);
        return pair.backup;
      } catch (backupErr: any) {
        blockchainLogger.log('rpc', 'error', `Both primary and backup RPC failed for chain ${chainId}`, backupErr?.message);
        this.updateHealth(chainId, pair.primary._getConnection().url, false, 0);
        // Fallback to primary anyway so ethers can throw standard provider error
        return pair.primary;
      }
    }
  }

  private updateHealth(chainId: ChainId, rpcUrl: string, isHealthy: boolean, latencyMs: number) {
    const current = this.healthStatus.get(chainId) || {
      chainId,
      rpcUrl,
      isHealthy: true,
      latencyMs: 0,
      lastChecked: new Date().toISOString(),
      errorCount: 0,
    };

    this.healthStatus.set(chainId, {
      ...current,
      rpcUrl,
      isHealthy,
      latencyMs,
      lastChecked: new Date().toISOString(),
      errorCount: isHealthy ? 0 : current.errorCount + 1,
    });
  }

  getHealthStatus(chainId: ChainId): RpcHealthStatus | undefined {
    return this.healthStatus.get(chainId);
  }
}

export const rpcManager = new RpcManager();
