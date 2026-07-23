"use client";

import React, { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Bell,
  Search,
  Plus,
  BarChart2,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { WatchlistService, WatchlistItem, PricePoint } from "@/services/watchlist.service";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<WatchlistItem | null>(null);
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "30D" | "1Y">("24H");
  const [chartData, setChartData] = useState<PricePoint[]>([]);

  // Price alert modal
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [targetPrice, setTargetPrice] = useState<string>("");

  useEffect(() => {
    const list = WatchlistService.getWatchlist();
    setWatchlist(list);
    if (list.length > 0 && !selectedToken) {
      setSelectedToken(list[0]);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (selectedToken) {
      const history = WatchlistService.getPriceChartHistory(selectedToken.symbol, timeframe);
      setChartData(history);
    }
  }, [selectedToken, timeframe]);

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = WatchlistService.toggleFavorite(id);
    setWatchlist(updated);
    toast.success("Watchlist updated.");
  };

  const handleSetAlert = () => {
    if (!selectedToken || !targetPrice) return;
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid target price.");
      return;
    }

    const updated = WatchlistService.setPriceAlert(selectedToken.id, priceNum);
    setWatchlist(updated);
    setShowAlertModal(false);
    setTargetPrice("");
    toast.success(`Price alert set for ${selectedToken.symbol} at $${priceNum}`);
  };

  const filteredList = watchlist.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background pb-28 pt-2">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        <ActionPageHeader title="Watchlist & Price Charts" backHref="/" />
        {/* CHART DISPLAY SECTION */}
        {selectedToken && (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xl">
            {/* Token Info Top Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-bold text-white shadow-md"
                  style={{ backgroundColor: selectedToken.color }}
                >
                  {selectedToken.symbol[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedToken.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedToken.symbol}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-foreground">
                  ${selectedToken.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`flex items-center justify-end gap-1 text-xs font-semibold ${
                    selectedToken.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {selectedToken.change24h >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {selectedToken.change24h >= 0 ? "+" : ""}
                    {selectedToken.change24h}% (24h)
                  </span>
                </div>
              </div>
            </div>

            {/* Timeframe Selector Toggles */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-background/50 p-1 text-xs">
              {(["24H", "7D", "30D", "1Y"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 rounded-xl py-1.5 font-semibold transition ${
                    timeframe === tf
                      ? "bg-primary text-black shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Interactive Recharts Area Chart */}
            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={selectedToken.change24h >= 0 ? "#10b981" : "#f43f5e"}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={selectedToken.change24h >= 0 ? "#10b981" : "#f43f5e"}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as PricePoint;
                        return (
                          <div className="rounded-xl border border-border bg-zinc-950 p-2 text-xs shadow-lg">
                            <div className="text-muted-foreground">{data.timestamp}</div>
                            <div className="font-bold text-foreground">${data.price.toLocaleString()}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={selectedToken.change24h >= 0 ? "#10b981" : "#f43f5e"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics & Alert Action */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
              <div>
                <span className="text-muted-foreground">24h High / Low</span>
                <div className="font-medium text-foreground">
                  ${selectedToken.high24h.toLocaleString()} / ${selectedToken.low24h.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Market Cap</span>
                <div className="font-medium text-foreground">
                  ${(selectedToken.marketCapUsd / 1e9).toFixed(2)}B
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setTargetPrice(selectedToken.priceUsd.toString());
                setShowAlertModal(true);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Bell className="h-4 w-4" />
              <span>
                Set Price Alert {selectedToken.alertPriceUpper ? `($${selectedToken.alertPriceUpper})` : ""}
              </span>
            </button>
          </div>
        )}

        {/* SEARCH BAR & WATCHLIST LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Tracked Tokens</h3>
            <span className="text-xs text-muted-foreground">{watchlist.length} Monitored</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search token name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden">
            {filteredList.map((token) => {
              const isSelected = selectedToken?.id === token.id;
              return (
                <div
                  key={token.id}
                  onClick={() => setSelectedToken(token)}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition ${
                    isSelected ? "bg-primary/10" : "hover:bg-foreground/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleToggleFavorite(token.id, e)}
                      className="text-amber-400 transition hover:scale-110"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          token.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>

                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: token.color }}
                    >
                      {token.symbol[0]}
                    </div>

                    <div>
                      <div className="font-bold text-sm text-foreground">{token.name}</div>
                      <div className="text-xs text-muted-foreground">{token.symbol}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">
                      ${token.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
              );
            })}
          </div>
        </div>
      </div>

      {/* PRICE ALERT SETTINGS MODAL */}
      <AnimatePresence>
        {showAlertModal && selectedToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-base">Set Price Alert</h3>
                </div>
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Receive instant push notifications when {selectedToken.name} ({selectedToken.symbol}) reaches your target price.
              </p>

              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Target Price (USD)</label>
                <input
                  type="number"
                  placeholder="Target Price USD"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-base font-bold text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 rounded-2xl border border-border py-3 text-xs font-semibold text-muted-foreground hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetAlert}
                  className="flex-1 rounded-2xl bg-primary py-3 text-xs font-bold text-black"
                >
                  Save Alert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
