"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MarketOverviewService } from "@/services/market-overview.service";
import { TokenDirectoryService } from "@/services/token-directory.service";
import { LivePriceEngineService } from "@/services/live-price-engine.service";
import { PriceAlertEngineService } from "@/services/price-alert-engine.service";
import { ChartEngineService } from "@/services/chart-engine.service";
import { WatchlistService, WatchlistItem } from "@/services/watchlist.service";
import {
  GlobalMarketOverview,
  TokenDetailItem,
  TokenSearchQuery,
  MarketRankingType,
  CategoryInfo,
  PriceAlertRule,
  ChartTimeframe,
  OHLCVPoint,
} from "@/types/market";

export function useMarketEngine() {
  const [overview, setOverview] = useState<GlobalMarketOverview | null>(null);
  const [tokens, setTokens] = useState<TokenDetailItem[]>([]);
  const [rankings, setRankings] = useState<Record<MarketRankingType, TokenDetailItem[]>>({
    top_gainers: [],
    top_losers: [],
    trending: [],
    most_visited: [],
    most_watchlisted: [],
    highest_volume: [],
    highest_market_cap: [],
    new_listings: [],
  });
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlertRule[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Background Refresh Polling Timer (30s)
  const isMounted = useRef<boolean>(true);

  const loadMarketData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      const [
        overviewData,
        tokensData,
        topGainers,
        topLosers,
        highestVol,
        categoriesData,
      ] = await Promise.all([
        MarketOverviewService.getOverview(),
        TokenDirectoryService.searchTokens({ limit: 50 }),
        TokenDirectoryService.getRankings("top_gainers", 6),
        TokenDirectoryService.getRankings("top_losers", 6),
        TokenDirectoryService.getRankings("highest_volume", 6),
        TokenDirectoryService.getCategories(),
      ]);

      if (!isMounted.current) return;

      setOverview(overviewData);
      setTokens(tokensData);
      setCategories(categoriesData);
      setRankings((prev) => ({
        ...prev,
        top_gainers: topGainers,
        top_losers: topLosers,
        highest_volume: highestVol,
        trending: tokensData.slice(0, 6),
        highest_market_cap: tokensData.slice(0, 6),
      }));

      // Load local state
      const currentWatchlist = WatchlistService.getWatchlist();
      setWatchlist(currentWatchlist);

      const currentAlerts = PriceAlertEngineService.getAlerts();
      setAlerts(currentAlerts);

      setRecentSearches(TokenDirectoryService.getRecentSearches());

      // Evaluate price alerts against fetched token prices
      const priceStatsMap: Record<string, any> = {};
      tokensData.forEach((t) => {
        priceStatsMap[t.symbol] = t.stats;
        priceStatsMap[t.id] = t.stats;
      });
      PriceAlertEngineService.evaluateAlerts(priceStatsMap);
    } catch (err: any) {
      console.error("[useMarketEngine]", err);
      setError(err?.message || "Failed to sync market data");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadMarketData();

    // Polling interval (30s background refresh)
    const intervalId = setInterval(() => {
      loadMarketData(true);
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [loadMarketData]);

  // Actions
  const searchTokens = async (query: TokenSearchQuery): Promise<TokenDetailItem[]> => {
    return await TokenDirectoryService.searchTokens(query);
  };

  const getTokenDetail = async (idOrSymbol: string): Promise<TokenDetailItem | null> => {
    return await TokenDirectoryService.getTokenDetail(idOrSymbol);
  };

  const getChartHistory = async (tokenId: string, timeframe: ChartTimeframe): Promise<OHLCVPoint[]> => {
    return (await ChartEngineService.getChartSeries(tokenId, timeframe)).points;
  };

  const toggleWatchlistFavorite = (id: string) => {
    const updated = WatchlistService.toggleFavorite(id);
    setWatchlist(updated);
  };

  const addPriceAlert = (rule: Omit<PriceAlertRule, "id" | "createdAt" | "triggered">) => {
    PriceAlertEngineService.createAlert(rule);
    setAlerts(PriceAlertEngineService.getAlerts());
  };

  const removePriceAlert = (id: string) => {
    PriceAlertEngineService.deleteAlert(id);
    setAlerts(PriceAlertEngineService.getAlerts());
  };

  const recordSearch = (keyword: string) => {
    const updated = TokenDirectoryService.saveRecentSearch(keyword);
    setRecentSearches(updated);
  };

  const clearRecentSearches = () => {
    TokenDirectoryService.clearRecentSearches();
    setRecentSearches([]);
  };

  return {
    overview,
    tokens,
    rankings,
    categories,
    watchlist,
    alerts,
    recentSearches,
    isLoading,
    isRefreshing,
    error,
    refresh: () => loadMarketData(true),
    searchTokens,
    getTokenDetail,
    getChartHistory,
    toggleWatchlistFavorite,
    addPriceAlert,
    removePriceAlert,
    recordSearch,
    clearRecentSearches,
  };
}
