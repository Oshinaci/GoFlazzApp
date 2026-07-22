"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Copy, Check, TrendingUp, Send, Download, RefreshCcw, Plus } from "lucide-react";
import { SIMULATED_TOTAL_BALANCE_USD } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";

export default function BalanceCard() {
  const { activeWallet, activeNetwork } = useWallet();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

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
    <div className="glass-card rounded-[2rem] mx-3 sm:mx-0 p-6 text-center shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[10px] font-medium text-warning">
          Simulated
        </span>
        <p className="text-xs text-muted-foreground font-medium">Total Net Balance</p>
        <Link href="/analytics" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Analytics</span>
        </Link>
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
      <p className="mt-1 text-sm text-success">+4.96% this week</p>

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

      {/* Action Buttons */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        <Link href="/send" className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/50 bg-background/50 hover:bg-surface py-2 transition">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Send className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-foreground">Send</span>
        </Link>
        <Link href="/receive" className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/50 bg-background/50 hover:bg-surface py-2 transition">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Download className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-foreground">Receive</span>
        </Link>
        <Link href="/bridge" className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/50 bg-background/50 hover:bg-surface py-2 transition">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RefreshCcw className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-foreground">Bridge</span>
        </Link>
        <Link href="/add-funds" className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 py-2 transition">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-background">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-semibold text-primary">Add Funds</span>
        </Link>
      </div>
    </div>
  );
}
