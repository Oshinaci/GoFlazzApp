"use client";

import React, { useState } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { useMarketEngine } from "@/hooks/useMarketEngine";
import { MarketChart } from "@/components/market/MarketChart";
import { TokenLogoEngine } from "@/services/token-logo.service";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  Bell,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Globe,
  ExternalLink,
  Layers,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  TokenDetailItem,
  TokenCategory,
  MarketRankingType,
  ChartTimeframe,
  PriceAlertType,
} from "@/types/market";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function MarketEnginePage() {
  const {
    overview,
    tokens,
    rankings,
    categories,
    watchlist,
    alerts,
    recentSearches,
    isLoading,
    isRefreshing,
    refresh,
    searchTokens,
    toggleWatchlistFavorite,
    addPriceAlert,
    removePriceAlert,
    recordSearch,
  } = useMarketEngine();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"directory" | "rankings" | "categories" | "watchlist" | "alerts">("directory");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory | "all">("all");
  const [activeRankingType, setActiveRankingType] = useState<MarketRankingType>("top_gainers");

  // Token Detail Modal
  const [selectedToken, setSelectedToken] = useState<TokenDetailItem | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>("1D");

  // Price Alert Modal
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [alertType, setAlertType] = useState<PriceAlertType>("ABOVE_PRICE");
  const [alertTarget, setAlertTarget] = useState<string>("");

  // Handle Search Input
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) recordSearch(val);
  };

  // Filter Tokens
  const filteredTokens = tokens.filter((t) => {
    const matchesQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contracts.some((c) => c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const handleCreateAlert = () => {
    if (!selectedToken || !alertTarget) return;
    const targetVal = parseFloat(alertTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error("Please enter a valid target value.");
      return;
    }

    addPriceAlert({
      userId: "user_demo",
      tokenId: selectedToken.id,
      tokenSymbol: selectedToken.symbol,
      alertType: alertType,
      targetValue: targetVal,
      currentValueAtCreation: selectedToken.stats.priceUsd,
      notifyPush: true,
      notifyEmail: false,
      enabled: true,
    });

    setShowAlertModal(false);
    setAlertTarget("");
    toast.success(`Price alert created for ${selectedToken.symbol}`);
  };

  return (
    <main className="min-h-screen bg-background pb-28 pt-2 text-foreground">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        <ActionPageHeader title="GoFlazz Market Engine" backHref="/" />

        {/* 1. MARKET OVERVIEW HEADER CARD */}
        {overview && (
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">Market Pulse</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      overview.marketStatus === "BULLISH"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {overview.marketStatus}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time global cryptocurrency metrics</p>
              </div>

              {/* Background Sync Refresh Status */}
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Syncing..." : "Live Feed"}</span>
              </button>
            </div>

            {/* Global Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
              <div className="p-3 rounded-2xl bg-background/40 border border-border/50">
                <span className="text-muted-foreground">Global Market Cap</span>
                <div className="text-base font-bold text-foreground mt-0.5">
                  ${(overview.totalMarketCapUsd / 1e12).toFixed(2)}T
                </div>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    overview.marketCapChange24hPercentage >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {overview.marketCapChange24hPercentage >= 0 ? "+" : ""}
                  {overview.marketCapChange24hPercentage.toFixed(2)}% (24h)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-background/40 border border-border/50">
                <span className="text-muted-foreground">24H Volume</span>
                <div className="text-base font-bold text-foreground mt-0.5">
                  ${(overview.totalVolume24hUsd / 1e9).toFixed(2)}B
                </div>
                <span className="text-muted-foreground/80">Global Spot</span>
              </div>

              <div className="p-3 rounded-2xl bg-background/40 border border-border/50">
                <span className="text-muted-foreground">BTC / ETH Dominance</span>
                <div className="text-base font-bold text-foreground mt-0.5">
                  {overview.btcDominancePercentage.toFixed(1)}% / {overview.ethDominancePercentage.toFixed(1)}%
                </div>
                <span className="text-indigo-400 font-medium">Market Dominance</span>
              </div>

              <div className="p-3 rounded-2xl bg-background/40 border border-border/50">
                <span className="text-muted-foreground">Fear & Greed Index</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {overview.fearAndGreedIndex.value}
                </div>
                <span className="text-muted-foreground/80">{overview.fearAndGreedIndex.classification}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. SEARCH & NAVIGATION TABS */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search token name, symbol, contract address, or chain..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-xs text-foreground outline-none focus:border-primary shadow-sm"
            />
          </div>

          {/* Recent Search Keywords Pill Bar */}
          {recentSearches.length > 0 && searchQuery === "" && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
              <span className="text-muted-foreground font-medium mr-1 text-[11px]">Recent:</span>
              {recentSearches.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setSearchQuery(kw)}
                  className="px-2.5 py-1 rounded-full bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 text-[11px] whitespace-nowrap transition"
                >
                  {kw}
                </button>
              ))}
            </div>
          )}

          {/* Navigation Bar */}
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
            {(["directory", "rankings", "categories", "watchlist", "alerts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-primary text-black shadow-md scale-105"
                    : "bg-card/50 text-muted-foreground hover:text-foreground border border-border/40"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 3. DIRECTORY TAB CONTENT */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                All Tokens
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Token Table / List */}
            <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden shadow-lg">
              {filteredTokens.map((token) => {
                const isFav = watchlist.some((w) => w.id === token.id && w.isFavorite);
                const logo = TokenLogoEngine.getTokenLogoUrl(token.symbol, token.logoUrl);

                return (
                  <div
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/5 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlistFavorite(token.id);
                        }}
                        className="text-muted-foreground/40 hover:text-amber-400 transition"
                      >
                        <Star className={`w-4 h-4 ${isFav ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logo}
                        alt={token.symbol}
                        className="w-9 h-9 rounded-full bg-neutral-800 p-0.5 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${token.symbol}.svg`;
                        }}
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{token.name}</span>
                          {token.verified && (
                            <span title="Verified Asset">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono uppercase">{token.symbol}</span>
                          <span>•</span>
                          <span className="capitalize">{token.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-foreground">
                        ${token.stats.priceUsd >= 1 ? token.stats.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) : token.stats.priceUsd.toFixed(4)}
                      </div>
                      <div
                        className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                          token.stats.priceChange24hPercentage >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {token.stats.priceChange24hPercentage >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {token.stats.priceChange24hPercentage >= 0 ? "+" : ""}
                          {token.stats.priceChange24hPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. RANKINGS TAB CONTENT */}
        {activeTab === "rankings" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(["top_gainers", "top_losers", "highest_volume", "trending"] as const).map((rType) => (
                <button
                  key={rType}
                  onClick={() => setActiveRankingType(rType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                    activeRankingType === rType
                      ? "bg-primary text-black shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {rType.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden shadow-lg">
              {(rankings[activeRankingType] || []).map((token, idx) => (
                <div
                  key={token.id}
                  onClick={() => setSelectedToken(token)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-muted-foreground w-5 text-center">#{idx + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={TokenLogoEngine.getTokenLogoUrl(token.symbol, token.logoUrl)}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full bg-neutral-800 p-0.5 object-cover"
                    />
                    <div>
                      <div className="font-bold text-sm text-foreground">{token.name}</div>
                      <div className="text-xs text-muted-foreground">{token.symbol}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">
                      ${token.stats.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        token.stats.priceChange24hPercentage >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {token.stats.priceChange24hPercentage >= 0 ? "+" : ""}
                      {token.stats.priceChange24hPercentage.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. CATEGORIES TAB CONTENT */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActiveTab("directory");
                }}
                className="rounded-3xl border border-border bg-card p-5 cursor-pointer hover:border-primary/50 transition shadow-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-foreground">{cat.name}</h3>
                  <span className="text-xs font-semibold text-emerald-400">
                    +{cat.change24hPercentage}% (24h)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Market Cap: ${(cat.marketCapUsd / 1e9).toFixed(1)}B</span>
                  <span className="text-primary font-medium">Explore &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. WATCHLIST TAB CONTENT */}
        {activeTab === "watchlist" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Favorite Tracked Assets</h3>
              <span className="text-xs text-muted-foreground">{watchlist.length} Assets</span>
            </div>

            <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden shadow-lg">
              {watchlist.map((token) => (
                <div
                  key={token.id}
                  onClick={() => {
                    const found = tokens.find((t) => t.id === token.id);
                    if (found) setSelectedToken(found);
                  }}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlistFavorite(token.id);
                      }}
                      className="text-amber-400"
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                    <div>
                      <div className="font-bold text-sm text-foreground">{token.name}</div>
                      <div className="text-xs text-muted-foreground">{token.symbol}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">
                      ${token.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        token.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {token.change24h >= 0 ? "+" : ""}
                      {token.change24h}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. ALERTS TAB CONTENT */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Price Alert Rules</h3>
              <span className="text-xs text-muted-foreground">{alerts.length} Active Rules</span>
            </div>

            <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden shadow-lg">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <p>No active price alert rules set.</p>
                  <p className="text-[11px] text-muted-foreground/60">
                    Select a token from the directory to create an automated price alert.
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {alert.tokenSymbol} - {alert.alertType.replace("_", " ")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Target: <strong className="text-foreground">${alert.targetValue}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removePriceAlert(alert.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-400 text-xs transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* TOKEN DETAIL MODAL WITH TRADINGVIEW LIGHTWEIGHT CHARTS */}
      <AnimatePresence>
        {selectedToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TokenLogoEngine.getTokenLogoUrl(selectedToken.symbol, selectedToken.logoUrl)}
                    alt={selectedToken.symbol}
                    className="w-10 h-10 rounded-full bg-neutral-800 p-0.5 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">{selectedToken.name}</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-800 text-muted-foreground">
                        {selectedToken.symbol}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{selectedToken.category} Asset</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAlertModal(true)}
                    className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/20 transition"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Alert</span>
                  </button>
                  <button
                    onClick={() => setSelectedToken(null)}
                    className="p-2 rounded-xl text-muted-foreground hover:bg-foreground/10 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Price Header */}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-2xl font-extrabold text-foreground">
                    ${selectedToken.stats.priceUsd >= 1 ? selectedToken.stats.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) : selectedToken.stats.priceUsd.toFixed(4)}
                  </span>
                  <span
                    className={`ml-2 text-xs font-bold ${
                      selectedToken.stats.priceChange24hPercentage >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selectedToken.stats.priceChange24hPercentage >= 0 ? "+" : ""}
                    {selectedToken.stats.priceChange24hPercentage.toFixed(2)}% (24h)
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Rank: <strong className="text-foreground">#{selectedToken.stats.marketCapRank}</strong>
                </div>
              </div>

              {/* TradingView Lightweight Chart */}
              <MarketChart
                tokenId={selectedToken.id}
                symbol={selectedToken.symbol}
                timeframe={chartTimeframe}
                onTimeframeChange={setChartTimeframe}
                height={280}
              />

              {/* Market Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-background/50 border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground">Market Cap</span>
                  <div className="font-bold text-foreground mt-0.5">
                    ${(selectedToken.stats.marketCapUsd / 1e9).toFixed(2)}B
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">24H Volume</span>
                  <div className="font-bold text-foreground mt-0.5">
                    ${(selectedToken.stats.volume24hUsd / 1e6).toFixed(2)}M
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">All-Time High</span>
                  <div className="font-bold text-foreground mt-0.5">
                    ${selectedToken.stats.athUsd.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Circulating Supply</span>
                  <div className="font-bold text-foreground mt-0.5">
                    {selectedToken.stats.circulatingSupply.toLocaleString()} {selectedToken.symbol}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk Rating</span>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {selectedToken.risk.level} ({selectedToken.risk.score}/100)
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Verified Audit</span>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {selectedToken.risk.audited ? "Passed" : "Pending"}
                  </div>
                </div>
              </div>

              {/* Socials & Contract Addresses */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-muted-foreground">Social & Contract Links</span>
                <div className="flex flex-wrap gap-2">
                  {selectedToken.socials.website && (
                    <a
                      href={selectedToken.socials.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedToken.socials.explorer && (
                    <a
                      href={selectedToken.socials.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE PRICE ALERT MODAL */}
      <AnimatePresence>
        {showAlertModal && selectedToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span>Set Price Alert for {selectedToken.symbol}</span>
                </h3>
                <button onClick={() => setShowAlertModal(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted-foreground">Alert Type</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as PriceAlertType)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-background text-foreground outline-none"
                  >
                    <option value="ABOVE_PRICE">Rises Above Price ($)</option>
                    <option value="BELOW_PRICE">Drops Below Price ($)</option>
                    <option value="PERCENT_CHANGE">Percentage Change (%)</option>
                    <option value="VOLUME_SPIKE">Volume Spike ($)</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted-foreground">Target Threshold Value</label>
                  <input
                    type="number"
                    placeholder="e.g. 70000"
                    value={alertTarget}
                    onChange={(e) => setAlertTarget(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl border border-border bg-background font-bold text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-black text-xs font-bold"
                >
                  Create Alert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
