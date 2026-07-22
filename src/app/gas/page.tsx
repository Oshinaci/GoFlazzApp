"use client";

import React, { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  Zap,
  Flame,
  Gauge,
  Clock,
  ShieldAlert,
  Bell,
  RefreshCw,
  TrendingDown,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { GasService, NetworkGasInfo, EstimatedActionFee } from "@/services/gas.service";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function GasTrackerPage() {
  const [selectedChain, setSelectedChain] = useState<string>("ethereum");
  const [gasInfo, setGasInfo] = useState<NetworkGasInfo>(GasService.getGasInfo("ethereum"));
  const [estimatedFees, setEstimatedFees] = useState<EstimatedActionFee[]>([]);
  const [gasHistory] = useState(GasService.getGasHistory());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const info = GasService.getGasInfo(selectedChain);
    setGasInfo(info);
    setEstimatedFees(GasService.getEstimatedFees(info.standardGwei));
  }, [selectedChain]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const info = GasService.getGasInfo(selectedChain);
      // Simulate minor gwei fluctuation
      info.standardGwei = Math.max(1, info.standardGwei + (Math.random() > 0.5 ? 1 : -1));
      setGasInfo({ ...info, updatedAt: "Just now" });
      setEstimatedFees(GasService.getEstimatedFees(info.standardGwei));
      setIsRefreshing(false);
      toast.success("Gas fees refreshed!");
    }, 600);
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <ActionPageHeader title="Gas Tracker" backHref="/" />

      <div className="container mt-4 max-w-md space-y-5 px-4">
        {/* CHAIN SELECTOR PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: "ethereum", name: "Ethereum" },
            { id: "arbitrum", name: "Arbitrum" },
            { id: "polygon", name: "Polygon" },
            { id: "base", name: "Base" },
            { id: "optimism", name: "Optimism" },
          ].map((chain) => (
            <button
              key={chain.id}
              onClick={() => setSelectedChain(chain.id)}
              className={`rounded-2xl border px-3.5 py-2 font-semibold transition whitespace-nowrap ${
                selectedChain === chain.id
                  ? "border-primary bg-primary text-black shadow-md"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {chain.name}
            </button>
          ))}
        </div>

        {/* LIVE GAS GWEI CARDS GRID */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Zap className="h-4 w-4 fill-primary" />
              <span>{gasInfo.chainName} Gas</span>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-foreground/5"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{gasInfo.updatedAt}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Low */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Slow</span>
              <div className="text-lg font-extrabold text-foreground mt-0.5">{gasInfo.lowGwei}</div>
              <span className="text-[10px] text-muted-foreground">Gwei</span>
            </div>

            {/* Standard */}
            <div className="rounded-2xl border border-primary bg-primary/20 p-3 text-center shadow-md">
              <span className="text-[10px] font-bold text-primary uppercase">Standard</span>
              <div className="text-xl font-extrabold text-foreground mt-0.5">{gasInfo.standardGwei}</div>
              <span className="text-[10px] text-muted-foreground">Gwei</span>
            </div>

            {/* Fast */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Fast</span>
              <div className="text-lg font-extrabold text-foreground mt-0.5">{gasInfo.fastGwei}</div>
              <span className="text-[10px] text-muted-foreground">Gwei</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3">
            <span>Base Fee: <strong className="text-foreground">{gasInfo.baseFeeGwei} Gwei</strong></span>
            <span>Priority: <strong className="text-foreground">{gasInfo.priorityFeeGwei} Gwei</strong></span>
          </div>
        </div>

        {/* ESTIMATED ACTION COST BREAKDOWN */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground">Estimated Operation Cost</h3>

          <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden">
            {estimatedFees.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                <div>
                  <div className="font-bold text-foreground">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Limit: {item.gasLimit.toLocaleString()} gas
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-primary">${item.feeUsd.toFixed(2)}</div>
                  <div className="text-[11px] text-muted-foreground">{item.feeEth} ETH</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORICAL GAS TREND CHART */}
        <div className="rounded-3xl border border-border bg-card p-4 space-y-3 shadow-md">
          <h4 className="text-xs font-semibold text-muted-foreground">24-Hour Gas Trend (Gwei)</h4>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gasHistory}>
                <defs>
                  <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-border bg-zinc-950 p-2 text-xs">
                          <div>{payload[0].payload.time}</div>
                          <div className="font-bold text-primary">{payload[0].value} Gwei</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="gwei" stroke="#8b5cf6" strokeWidth={2} fill="url(#gasGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}
