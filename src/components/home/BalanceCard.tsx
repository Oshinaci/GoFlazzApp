"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { SIMULATED_TOTAL_BALANCE_USD, mockBalanceHistory } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import type { BalancePoint } from "@/types";
import { useWallet } from "@/hooks/useWallet";

export default function BalanceCard() {
  const { activeWallet, activeNetwork } = useWallet();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const balanceHistory: BalancePoint[] = mockBalanceHistory;

  const handleCopy = async () => {
    if (!activeWallet) return;
    try {
      await navigator.clipboard.writeText(activeWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Ignore
    }
  };

  return (
    <div className="glass-card p-6 text-center">
      <div className="flex items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">Total Balance</p>
        <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
          Simulated
        </span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <p className="text-4xl font-bold tracking-tight">
          {isVisible ? formatCurrency(SIMULATED_TOTAL_BALANCE_USD) : "••••••"}
        </p>
        <button
          aria-label={isVisible ? "Hide balance" : "Show balance"}
          onClick={() => setIsVisible((prev: boolean) => !prev)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1 text-sm text-success">+4.2% this week</p>

      {activeWallet && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-surface/40 px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <span className="text-[9px] bg-primary/20 text-primary border border-primary/25 rounded px-1.5 py-0.5 uppercase tracking-wider font-bold">
              {activeNetwork === "arbitrum" ? "Arbitrum One" : activeNetwork || "Arbitrum One"}
            </span>
            <span className="truncate text-foreground font-semibold max-w-[90px]">
              {activeWallet.name}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition">
            <span>
              {activeWallet.address.substring(0, 6)}...{activeWallet.address.substring(activeWallet.address.length - 4)}
            </span>
            <button onClick={handleCopy} className="p-1 rounded hover:bg-foreground/5 transition">
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={balanceHistory}>
            <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
