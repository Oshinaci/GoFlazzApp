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
    <div className="rounded-[20px] bg-card border border-border/80 p-5 text-center shadow-sm relative overflow-hidden space-y-3">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
          Simulated
        </span>
        <p className="text-[13px] text-muted-foreground font-medium">Total Net Balance</p>
        <Link href="/analytics" className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Analytics</span>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2">
        <p className="text-[32px] font-extrabold tracking-tight text-foreground">
          {isVisible ? formatCurrency(SIMULATED_TOTAL_BALANCE_USD) : "••••••"}
        </p>
        <button
          aria-label={isVisible ? "Hide balance" : "Show balance"}
          onClick={() => setIsVisible((prev: boolean) => !prev)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
        >
          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-[13px] font-semibold text-emerald-500">+4.96% this week</p>

      {activeWallet && (
        <div className="flex items-center justify-between rounded-[14px] border border-border/80 bg-card-secondary px-3.5 py-2 text-[12px]">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-md px-1.5 py-0.5 uppercase tracking-wider font-bold">
              {activeNetwork === "arbitrum" ? "Arbitrum One" : activeNetwork || "Arbitrum One"}
            </span>
            <span className="truncate text-foreground font-semibold max-w-[100px]">
              {activeWallet.name}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition">
            <span>
              {activeWallet.address.substring(0, 6)}...{activeWallet.address.substring(activeWallet.address.length - 4)}
            </span>
            <button onClick={handleCopy} className="p-1 rounded hover:bg-foreground/5 transition">
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <Link href="/send" className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-border/80 bg-card-secondary hover:border-primary/40 py-2.5 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
            <Send className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-semibold text-foreground">Send</span>
        </Link>
        <Link href="/receive" className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-border/80 bg-card-secondary hover:border-primary/40 py-2.5 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
            <Download className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-semibold text-foreground">Receive</span>
        </Link>
        <Link href="/bridge" className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-border/80 bg-card-secondary hover:border-primary/40 py-2.5 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
            <RefreshCcw className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-semibold text-foreground">Bridge</span>
        </Link>
        <Link href="/add-funds" className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-primary/30 bg-primary/10 hover:bg-primary/20 py-2.5 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-primary text-white">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-semibold text-primary">Add Funds</span>
        </Link>
      </div>
    </div>
  );
}
