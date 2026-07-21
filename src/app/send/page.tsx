"use client";

import { useState } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { mockAssets } from "@/data/mock";
import type { Asset } from "@/types";

export default function SendPage() {
  const assets: Asset[] = mockAssets;
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id ?? "");
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="container max-w-md">
        <ActionPageHeader title="Send" />

        <div className="glass-card space-y-5 p-6">
          <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            Phase 1 preview — sending is UI only. On-chain transfers arrive in a later phase.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Asset</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              {assets.map((asset: Asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.symbol}) — {asset.balance} available
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Recipient address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Amount</label>
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
