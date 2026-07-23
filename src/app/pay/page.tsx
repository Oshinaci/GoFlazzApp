"use client";

import { useState } from "react";
import { ScanLine, AlertCircle } from "lucide-react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";

export default function PayPage() {
  const [amount, setAmount] = useState<string>("");

  return (
    <main className="min-h-screen bg-background pb-28 pt-4">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        <ActionPageHeader title="Scan & Pay" backHref="/" />

        <div className="rounded-[20px] bg-card border border-border/80 p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 rounded-[14px] border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] font-medium text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Merchant QR payments feature simulation.</span>
          </div>

          <button
            type="button"
            className="flex w-full flex-col items-center gap-3 rounded-[18px] border border-dashed border-primary/40 bg-card-secondary py-10 transition hover:border-primary hover:bg-primary/5 cursor-pointer group"
          >
            <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <ScanLine className="h-8 w-8" />
            </div>
            <span className="text-[14px] font-semibold text-foreground">Tap to Scan Merchant QR Code</span>
          </button>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-muted-foreground">Or Enter Payment Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-[14px] border border-border/80 bg-card-secondary px-3.5 py-2.5 text-[14px] font-bold text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <button
            type="button"
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full rounded-[14px] bg-primary py-3 text-[14px] font-bold text-white shadow-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pay Merchant
          </button>
        </div>
      </div>
    </main>
  );
}
