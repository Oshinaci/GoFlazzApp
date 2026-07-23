"use client";

import { useState } from "react";
import { Copy, Check, QrCode, AlertCircle } from "lucide-react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { truncateAddress } from "@/lib/utils";
import { toast } from "sonner";

const SIMULATED_ADDRESS: string = "0x7A29fB8c1e4D2a6F9b0C3d5E8f1A2b4C6d8E0f12";

export default function ReceivePage() {
  const [copied, setCopied] = useState<boolean>(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(SIMULATED_ADDRESS);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address.");
    }
  }

  return (
    <main className="min-h-screen bg-background pb-28 pt-4">
      <div className="mx-auto max-w-[440px] px-3 sm:px-4 space-y-4">
        <ActionPageHeader title="Receive Assets" backHref="/" />

        <div className="rounded-[20px] bg-card border border-border/80 p-5 text-center shadow-sm space-y-4">
          <div className="flex items-center gap-2 rounded-[14px] border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] font-medium text-amber-500 text-left">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Receive Arbitrum, EVM, & GoFlazz tokens using this address.</span>
          </div>

          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-[20px] border border-border/80 bg-card-secondary p-4 shadow-inner">
            <QrCode className="h-32 w-32 text-foreground/80" />
          </div>

          <div className="space-y-1">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Your Wallet Address</p>
            <p className="font-mono text-[14px] font-bold text-foreground break-all bg-card-secondary p-2.5 rounded-[12px] border border-border/60 select-all">
              {SIMULATED_ADDRESS}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-primary py-3 text-[14px] font-bold text-white shadow-sm hover:bg-primary/90 transition"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Address Copied!" : "Copy Wallet Address"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
