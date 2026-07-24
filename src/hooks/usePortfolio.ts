"use client";

import { useMemo, useState } from "react";
import { useWallet } from "./useWallet";
import { useWalletBalances } from "./useWalletBalances";
import { useMarketEngine } from "./useMarketEngine";
import { Asset } from "@/types";

export function usePortfolio() {
  const { activeWallet, activeNetwork } = useWallet();
  const { balances, loading: balancesLoading } = useWalletBalances(activeWallet?.id);
  const { tokens, isLoading: marketLoading } = useMarketEngine();
  const [showHiddenAssets, setShowHiddenAssets] = useState(false);

  const loading = balancesLoading || marketLoading;

  const assets: Asset[] = useMemo(() => {
    if (!activeWallet || balances.length === 0) return [];

    const mapped = balances.map((bal) => {
      // Find market data for the asset
      const marketToken = tokens.find(
        (t) => t.symbol.toLowerCase() === bal.asset_symbol.toLowerCase()
      );

      const price = marketToken?.stats.priceUsd || 0;
      const change24h = marketToken?.stats.priceChange24hPercentage || 0;
      const valueUsd = bal.balance * price;
      
      // We will generate a fallback color based on the symbol if marketToken doesn't provide one
      const color = "#6366f1"; // default indigo
      const name = marketToken?.name || bal.asset_symbol.toUpperCase();

      return {
        id: bal.id,
        symbol: bal.asset_symbol.toUpperCase(),
        name,
        balance: bal.balance,
        valueUsd,
        changePercent24h: change24h,
        color,
      };
    });

    const filtered = showHiddenAssets ? mapped : mapped.filter(a => a.balance > 0);

    return filtered.sort((a, b) => b.valueUsd - a.valueUsd);
  }, [activeWallet, balances, tokens, showHiddenAssets]);

  const totalPortfolioValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.valueUsd, 0);
  }, [assets]);

  // Calculate 24h PnL
  const dailyPnL = useMemo(() => {
    return assets.reduce((sum, asset) => {
      // PnL = (Current Value / (1 + changePercent24h / 100)) * (changePercent24h / 100)
      const previousValue = asset.valueUsd / (1 + asset.changePercent24h / 100);
      return sum + (asset.valueUsd - previousValue);
    }, 0);
  }, [assets]);

  const dailyPnLPercentage = useMemo(() => {
    if (totalPortfolioValue === 0) return 0;
    const previousPortfolioValue = totalPortfolioValue - dailyPnL;
    if (previousPortfolioValue === 0) return 0;
    return (dailyPnL / previousPortfolioValue) * 100;
  }, [totalPortfolioValue, dailyPnL]);

  return {
    activeWallet,
    activeNetwork,
    assets,
    totalPortfolioValue,
    dailyPnL,
    dailyPnLPercentage,
    loading,
    showHiddenAssets,
    setShowHiddenAssets,
  };
}
