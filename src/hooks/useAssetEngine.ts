"use client";

import { useState, useEffect, useCallback } from "react";
import { ChainId } from "@/types/blockchain";
import { AssetBalance, EnhancedTransactionRecord, NftItemRecord, PortfolioSummary, TokenPriceData } from "@/types/asset-engine";
import { AssetService } from "@/services/asset.service";
import { PriceService } from "@/services/price.service";
import { PortfolioService } from "@/services/portfolio.service";

export function useAssetEngine(chainId: ChainId = 42161, walletAddress?: string) {
  const [assetBalance, setAssetBalance] = useState<AssetBalance | null>(null);
  const [prices, setPrices] = useState<Record<string, TokenPriceData>>({});
  const [transactions, setTransactions] = useState<EnhancedTransactionRecord[]>([]);
  const [nfts, setNfts] = useState<NftItemRecord[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [balanceData, priceData, txs, nftList] = await Promise.all([
        AssetService.getAssetBalance(chainId, walletAddress),
        PriceService.fetchTokenPrices(),
        AssetService.getTransactionHistory(chainId, walletAddress),
        AssetService.getNfts(chainId, walletAddress),
      ]);

      setAssetBalance(balanceData);
      setPrices(priceData);
      setTransactions(txs);
      setNfts(nftList);
      setPortfolioSummary(PortfolioService.calculatePortfolioSummary(balanceData));
    } catch (err: any) {
      setError(err?.message || "Failed to load asset engine data");
    } finally {
      setLoading(false);
    }
  }, [chainId, walletAddress]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s background smart poll
    return () => clearInterval(interval);
  }, [loadData]);

  return {
    assetBalance,
    prices,
    transactions,
    nfts,
    portfolioSummary,
    loading,
    error,
    refreshAssets: loadData,
  };
}
