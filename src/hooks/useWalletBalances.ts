"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BalanceService, WalletBalanceRecord } from "@/services/balance.service";

export function useWalletBalances(walletId?: string) {
  const { user } = useAuth();
  const [balances, setBalances] = useState<WalletBalanceRecord[]>([]);

  const fetchBalances = useCallback(async () => {
    if (!user) {
      setBalances([]);
      return;
    }
    const data = await BalanceService.getBalances(user.id, walletId);
    setBalances(data);
  }, [user, walletId]);

  const updateBalance = async (targetWalletId: string, assetSymbol: string, balance: number, tokenAddress?: string) => {
    if (!user) return;
    await BalanceService.upsertBalance(user.id, targetWalletId, assetSymbol, balance, tokenAddress);
    await fetchBalances();
  };

  return {
    balances,
    fetchBalances,
    updateBalance,
  };
}
