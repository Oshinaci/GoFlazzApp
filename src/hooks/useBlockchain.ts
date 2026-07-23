"use client";

import { useState, useEffect, useCallback } from "react";
import { ChainId, GasPriceData, RpcHealthStatus } from "@/types/blockchain";
import { SUPPORTED_NETWORKS } from "@/lib/networks";
import { BlockchainService } from "@/services/blockchain.service";
import { rpcManager } from "@/providers/rpc-manager";

export function useBlockchain(initialChainId: ChainId = 42161) {
  const [chainId, setChainId] = useState<ChainId>(initialChainId);
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [gasPrice, setGasPrice] = useState<GasPriceData | null>(null);
  const [rpcHealth, setRpcHealth] = useState<RpcHealthStatus | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const network = SUPPORTED_NETWORKS[chainId];

  const refreshNetworkData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [block, gas, health] = await Promise.all([
        BlockchainService.getBlockNumber(chainId),
        BlockchainService.getGasPrice(chainId),
        Promise.resolve(rpcManager.getHealthStatus(chainId)),
      ]);
      setBlockNumber(block);
      setGasPrice(gas);
      setRpcHealth(health);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch blockchain data");
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    refreshNetworkData();
    const interval = setInterval(refreshNetworkData, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [refreshNetworkData]);

  const switchNetwork = (newChainId: ChainId) => {
    if (SUPPORTED_NETWORKS[newChainId]) {
      setChainId(newChainId);
    }
  };

  return {
    chainId,
    network,
    blockNumber,
    gasPrice,
    rpcHealth,
    loading,
    error,
    switchNetwork,
    refreshNetworkData,
  };
}
