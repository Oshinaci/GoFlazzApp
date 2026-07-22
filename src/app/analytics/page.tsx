"use client";

import React, { useState } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { mockBalanceHistory, mockAssets } from "@/data/mock";

const PORTFOLIO_HISTORY_VARIANTS = {
  "1D": [
    { date: "00:00", value: 12200 },
    { date: "04:00", value: 12150 },
    { date: "08:00", value: 12380 },
    { date: "12:00", value: 12300 },
    { date: "16:00", value: 12410 },
    { date: "20:00", value: 12480.32 },
  ],
  "1W": mockBalanceHistory,
  "1M": [
    { date: "Wk 1", value: 10400 },
    { date: "Wk 2", value: 11100 },
    { date: "Wk 3", value: 11850 },
    { date: "Wk 4", value: 12480.32 },
  ],
  "1Y": [
    { date: "Jan", value: 6200 },
    { date: "Mar", value: 7800 },
    { date: "Jun", value: 9400 },
    { date: "Sep", value: 11200 },
    { date: "Now", value: 12480.32 },
  ],
};

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "1Y">("1W");
  const chartData = PORTFOLIO_HISTORY_VARIANTS[timeframe];

  const totalValue = mockAssets.reduce((acc, a) => acc + a.valueUsd, 0);

  const pieData = mockAssets.map((asset) => ({
    name: asset.symbol,
    value: asset.valueUsd,
    color: asset.color,
  }));

  return (
    <main className="min-h-screen bg-background pb-24">
      <ActionPageHeader title="Portfolio Analytics & Charts" backHref="/" />

      <div className="container mt-4 max-w-md space-y-5 px-4">
        {/* PORTFOLIO BALANCE HISTORY CHART CARD */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Portfolio Net Value</span>
              <div className="text-2xl font-black text-foreground mt-0.5">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-2xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>+$590.32 (+4.96%)</span>
            </div>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-1 text-xs">
            {(["1D", "1W", "1M", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 rounded-xl py-1.5 font-bold transition ${
                  timeframe === tf ? "bg-primary text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Area Chart */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-border bg-zinc-950 p-2 text-xs font-bold text-foreground">
                          ${payload[0].value?.toLocaleString()}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#portfolioGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ASSET ALLOCATION PIE CHART */}
        <div className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            <span>Asset Allocation Breakdown</span>
          </h3>

          <div className="flex items-center justify-between">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2 pl-4 text-xs">
              {pieData.map((asset, idx) => {
                const percent = ((asset.value / totalValue) * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="font-bold text-foreground">{asset.name}</span>
                    </div>
                    <span className="font-semibold text-muted-foreground">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
