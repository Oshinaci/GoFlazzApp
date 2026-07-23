"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BalanceService, WalletBalanceRecord } from "@/services/balance.service";

export function useWalletBalances(walletId?: string) {
  const { user } = useAuth();
  const [balances, setBalances] = useState<WalletBalanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBalances = useCallback(async () => {
    if (!user) {
      setBalances([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await BalanceService.getBalances(user.id, walletId);
      setBalances(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, walletId]);

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
    fetchBalances,
    updateBalance,
  };
}
