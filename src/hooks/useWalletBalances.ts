"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BalanceService, WalletBalanceRecord } from "@/services/balance.service";
import { WalletSyncService } from "@/services/wallet/walletSync";
import { useWallet } from "@/hooks/useWallet";

export function useWalletBalances(walletId?: string) {
  const { user } = useAuth();
  const { activeWallet, activeNetwork } = useWallet();
  const [balances, setBalances] = useState<WalletBalanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!user || !walletId) {
      setBalances([]);
      setLoading(false);
      return;
    }
    
    // We need activeWallet details to get the address and network
    const currentWallet = activeWallet?.id === walletId ? activeWallet : null;
    
    setLoading(true);
    setError(null);
    try {
      if (currentWallet && activeNetwork) {
        // Fetch from blockchain (real data)
        const onChainBalances = await WalletSyncService.syncBalances(
          user.id, 
          walletId, 
          currentWallet.address, 
          activeNetwork
        );
        setBalances(onChainBalances);
      } else {
        // Fallback to database if wallet address isn't readily available
        const data = await BalanceService.getBalances(user.id, walletId);
        setBalances(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err);
      // Fallback to database if blockchain fetch fails (e.g. rate limit, RPC down)
      try {
        const data = await BalanceService.getBalances(user.id, walletId);
        setBalances(data);
      } catch (dbErr) {
        console.error("Fallback DB fetch failed", dbErr);
      }
    } finally {
      setLoading(false);
    }
  }, [user, walletId, activeWallet, activeNetwork]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(() => {
      fetchBalances();
    }, 15000); // 15 seconds polling for real-time updates
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const updateBalance = async (targetWalletId: string, assetSymbol: string, balance: number, tokenAddress?: string) => {
    if (!user) return;
    await BalanceService.upsertBalance(user.id, targetWalletId, assetSymbol, balance, tokenAddress);
    await fetchBalances();
  };

  return {
    balances,
    loading,
    error,
    fetchBalances,
    updateBalance,
  };
}
