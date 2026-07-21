"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";

export default function PayPage() {
  const [amount, setAmount] = useState<string>("");

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="container max-w-md">
        <ActionPageHeader title="Pay" />

        <div className="glass-card space-y-5 p-6">
          <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            Phase 1 preview — merchant payments are UI only for now.
          </p>

          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 opacity-60"
          >
            <ScanLine className="h-8 w-8 text-primary" />
            <span className="text-sm">Scan merchant QR</span>
          </button>

          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Or enter amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-blue-gradient px-4 py-2.5 text-sm font-medium opacity-40"
          >
            Available in Phase 2
          </button>
        </div>
      </div>
    </main>
  );
}
