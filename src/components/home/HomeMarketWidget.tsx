"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMarketEngine } from "@/hooks/useMarketEngine";
import { TokenLogoEngine } from "@/services/token-logo.service";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Flame,
  Star,
  RefreshCw,
  BarChart2,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function HomeMarketWidget() {
  const { overview, rankings, tokens, watchlist, isLoading, isRefreshing, refresh, toggleWatchlistFavorite } =
    useMarketEngine();

  const [activeTab, setActiveTab] = useState<"trending" | "gainers" | "all">("trending");

  const displayTokens =
    activeTab === "trending"
      ? rankings.trending.length > 0
        ? rankings.trending.slice(0, 5)
        : tokens.slice(0, 5)
      : activeTab === "gainers"
      ? rankings.top_gainers.length > 0
        ? rankings.top_gainers.slice(0, 5)
        : tokens.slice(0, 5)
      : tokens.slice(0, 5);

  return (
    <section className="space-y-3">
      {/* Widget Header */}
      <div className="px-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span>Market Live</span>
          {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin text-primary ml-1" />}
        </div>
        <Link
          href="/market"
          className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1"
        >
          <span>View Markets</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Global Market Overview Bar */}
      {overview && (
        <div className="grid grid-cols-3 gap-2 rounded-[16px] bg-card border border-border/80 p-3 shadow-sm text-center">
          <div>
            <span className="text-[10px] text-muted-foreground font-medium block">Market Cap</span>
            <span className="text-[12px] font-bold text-foreground">
              ${(overview.totalMarketCapUsd / 1e12).toFixed(2)}T
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-medium block">24h Vol</span>
            <span className="text-[12px] font-bold text-foreground">
              ${(overview.totalVolume24hUsd / 1e9).toFixed(1)}B
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-medium block">BTC Dom</span>
            <span className="text-[12px] font-bold text-foreground">
              {overview.btcDominancePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-1.5 bg-card border border-border/80 p-1 rounded-[14px]">
        <button
          onClick={() => setActiveTab("trending")}
          className={cn(
            "flex-1 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all text-center flex items-center justify-center gap-1",
            activeTab === "trending"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Trending</span>
        </button>
        <button
          onClick={() => setActiveTab("gainers")}
          className={cn(
            "flex-1 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all text-center flex items-center justify-center gap-1",
            activeTab === "gainers"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Top Gainers</span>
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex-1 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all text-center flex items-center justify-center gap-1",
            activeTab === "all"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Top Tokens</span>
        </button>
      </div>

      {/* Token List Card */}
      <div className="rounded-[20px] bg-card border border-border/80 divide-y divide-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary" />
            <p className="text-[12px] text-muted-foreground font-medium">Loading live market prices...</p>
          </div>
        ) : displayTokens.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-muted-foreground">No market data available.</div>
        ) : (
          displayTokens.map((token) => {
            const priceChange = token.stats?.priceChange24hPercentage ?? 0;
            const isPositive = priceChange >= 0;
            const logo = TokenLogoEngine.getTokenLogoUrl(token.symbol, token.logoUrl);
            const isFav = watchlist.some((w) => w.symbol === token.symbol);

            return (
              <div
                key={token.id}
                className="flex items-center justify-between p-3.5 hover:bg-foreground/5 transition group cursor-pointer"
              >
                <Link href="/market" className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Token Logo */}
                  <div className="relative h-9 w-9 shrink-0 rounded-full border border-border/60 bg-card-secondary p-1 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo}
                      alt={token.symbol}
                      className="h-full w-full object-contain rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=5B8CFF&color=fff&bold=true`;
                      }}
                    />
                  </div>

                  {/* Token Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[14px] text-foreground tracking-tight leading-none">
                        {token.symbol}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase bg-card-secondary px-1.5 py-0.5 rounded border border-border/60">
                        {token.category}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-muted-foreground truncate mt-0.5">
                      {token.name}
                    </p>
                  </div>
                </Link>

                {/* Price & Change */}
                <div className="text-right flex items-center gap-3 shrink-0">
                  <div>
                    <p className="text-[14px] font-bold text-foreground tracking-tight">
                      ${token.stats.priceUsd < 1 ? token.stats.priceUsd.toFixed(4) : token.stats.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div
                      className={cn(
                        "flex items-center justify-end gap-0.5 text-[11px] font-semibold",
                        isPositive ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>
                        {isPositive ? "+" : ""}
                        {priceChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Star Favorite Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlistFavorite(token.id);
                    }}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition"
                    title={isFav ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Star
                      className={cn("h-4 w-4", isFav ? "fill-amber-400 text-amber-400" : "text-muted-foreground/60")}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link to Market Engine */}
      <Link
        href="/market"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-[16px] border border-border/80 bg-card hover:border-primary/40 hover:bg-card-secondary text-[13px] font-semibold text-primary transition shadow-sm"
      >
        <span>Explore Full Market Engine</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
