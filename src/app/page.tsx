"use client";

import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import BalanceCard from "@/components/home/BalanceCard";
import QuickActions from "@/components/home/QuickActions";
import AssetList from "@/components/home/AssetList";
import HomeMarketWidget from "@/components/home/HomeMarketWidget";
import { TrendingUp, ArrowRight } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketEngine } from "@/hooks/useMarketEngine";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const { activeWallet, activeNetwork, assets, totalPortfolioValue, dailyPnLPercentage, loading: portfolioLoading } = usePortfolio();
  const { tokens, watchlist, isLoading: marketLoading } = useMarketEngine();

  const loading = portfolioLoading || marketLoading;

  // Real watchlist or fallback to top trending if empty
  const displayWatchlist = watchlist.length > 0 
    ? tokens.filter(t => watchlist.some(w => w.symbol === t.symbol)).slice(0, 3) 
    : tokens.slice(0, 3);

  return (
    <main className="min-h-screen bg-background pb-28 pt-2">
      <TopBar />
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4 mt-3">
        {/* Main Balance Hero */}
        <BalanceCard 
          activeWallet={activeWallet}
          activeNetwork={activeNetwork}
          totalPortfolioValue={totalPortfolioValue}
          dailyPnLPercentage={dailyPnLPercentage}
          loading={loading}
        />

        {/* Quick Actions Grid */}
        <QuickActions />

        {/* Assets List */}
        <AssetList 
          assets={assets}
          loading={loading}
        />

        {/* Live Market Feature Widget */}
        <HomeMarketWidget />

        {/* Watchlist Highlights */}
        <section className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Watchlist</span>
            </div>
            <Link href="/market" className="text-[12px] text-primary hover:underline font-semibold flex items-center gap-1">
              <span>Markets</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {displayWatchlist.map((item, idx) => (
              <Link
                key={idx}
                href="/market"
                className="rounded-[16px] border border-border/80 bg-card p-3 transition hover:border-primary/40 text-left space-y-1 shadow-sm"
              >
                <div className="text-[13px] font-bold text-foreground">{item.symbol}</div>
                <div className="text-[12px] font-semibold text-muted-foreground">{formatCurrency(item.stats.priceUsd)}</div>
                <div className={`text-[11px] font-bold ${item.stats.priceChange24hPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {item.stats.priceChange24hPercentage >= 0 ? "+" : ""}{item.stats.priceChange24hPercentage.toFixed(2)}%
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
