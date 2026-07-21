"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { truncateAddress } from "@/lib/utils";

const SIMULATED_ADDRESS: string = "0x7A29fB8c1e4D2a6F9b0C3d5E8f1A2b4C6d8E0f12";

export default function ReceivePage() {
  const [copied, setCopied] = useState<boolean>(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(SIMULATED_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fail silently, this is a UI-only stub.
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="container max-w-md">
        <ActionPageHeader title="Receive" />

        <div className="glass-card space-y-5 p-6 text-center">
          <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            Phase 1 preview — this is a simulated address, not a real wallet yet.
          </p>

          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border border-border bg-surface">
            <QrCode className="h-24 w-24 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Your Arbitrum One address</p>
            <p className="mt-1 break-all font-mono text-sm">{truncateAddress(SIMULATED_ADDRESS, 8)}</p>
          </div>

          <button
            onClick={handleCopy}
            className="mx-auto flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition hover:bg-white/5"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
      </div>
    </main>
  );
}
