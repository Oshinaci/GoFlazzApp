"use client";

import { useState } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { mockAssets } from "@/data/mock";
import type { Asset } from "@/types";
import { toast } from "sonner";
import { Send, AlertCircle } from "lucide-react";

export default function SendPage() {
  const assets: Asset[] = mockAssets;
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id ?? "");
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  const handleSend = () => {
    if (!recipient.trim()) {
      toast.error("Please enter a valid recipient address.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount to send.");
      return;
    }
    toast.success(`Sent ${amount} ${selectedAsset.symbol} to ${recipient.slice(0, 6)}...!`);
    setAmount("");
    setRecipient("");
  };

  return (
    <main className="min-h-screen bg-background pb-28 pt-4">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        <ActionPageHeader title="Send Assets" backHref="/" />

        <div className="rounded-[20px] bg-card border border-border/80 p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 rounded-[14px] border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] font-medium text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Simulated send mode — transactions execute safely in preview.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-muted-foreground">Select Asset</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full rounded-[14px] border border-border/80 bg-card-secondary px-3.5 py-2.5 text-[14px] font-medium text-foreground outline-none focus:border-primary"
            >
              {assets.map((asset: Asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.symbol}) — {asset.balance} available
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-muted-foreground">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x... or ENS name"
              className="w-full rounded-[14px] border border-border/80 bg-card-secondary px-3.5 py-2.5 text-[14px] font-medium text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-muted-foreground">Amount</label>
              <button
                type="button"
                onClick={() => setAmount(selectedAsset.balance.toString())}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Max ({selectedAsset.balance} {selectedAsset.symbol})
              </button>
            </div>
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
            onClick={handleSend}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-[14px] bg-primary py-3 text-[14px] font-bold text-white shadow-sm hover:bg-primary/90 transition"
          >
            <Send className="h-4 w-4" />
            <span>Confirm & Send</span>
          </button>
        </div>
      </div>
    </main>
  );
}
