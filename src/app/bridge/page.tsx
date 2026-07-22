"use client";

import React, { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  ArrowRight,
  RefreshCcw,
  Zap,
  ShieldCheck,
  ChevronDown,
  Clock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  BridgeService,
  SUPPORTED_BRIDGE_CHAINS,
  ChainOption,
  BridgeProvider,
  BridgeQuoteRequest,
  BridgeExecutionResult,
} from "@/services/bridge.service";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function BridgePage() {
  const [fromChain, setFromChain] = useState<ChainOption>(SUPPORTED_BRIDGE_CHAINS[0]); // Ethereum
  const [toChain, setToChain] = useState<ChainOption>(SUPPORTED_BRIDGE_CHAINS[1]); // Arbitrum
  const [amount, setAmount] = useState<string>("0.25");
  const [assetSymbol] = useState<string>("ETH");

  const [providers, setProviders] = useState<BridgeProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<BridgeProvider | null>(null);
  const [isBridging, setIsBridging] = useState<boolean>(false);
  const [bridgeResult, setBridgeResult] = useState<BridgeExecutionResult | null>(null);

  const [showFromSelect, setShowFromSelect] = useState<boolean>(false);
  const [showToSelect, setShowToSelect] = useState<boolean>(false);

  useEffect(() => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setProviders([]);
      setSelectedProvider(null);
      return;
    }

    const req: BridgeQuoteRequest = {
      fromChain,
      toChain,
      assetSymbol,
      amount: num,
    };
    const fetched = BridgeService.getBridgeProviders(req);
    setProviders(fetched);
    if (fetched.length > 0) setSelectedProvider(fetched[0]);
  }, [fromChain, toChain, amount, assetSymbol]);

  const handleSwapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  const handleExecuteBridge = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !selectedProvider) return;

    setIsBridging(true);
    try {
      const res = await BridgeService.executeBridge(
        { fromChain, toChain, assetSymbol, amount: num },
        selectedProvider
      );
      if (res.success) {
        setBridgeResult(res);
        toast.success(`Bridge initiated via ${res.provider}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute bridge.");
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <ActionPageHeader title="Cross-Chain Bridge" backHref="/" />

      <div className="container mt-4 max-w-md space-y-5 px-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xl space-y-4">
          {/* CHAIN SELECTION ROW */}
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
            {/* From Chain */}
            <div className="rounded-2xl border border-border bg-background/60 p-3 text-left">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">From Network</span>
              <button
                onClick={() => setShowFromSelect(true)}
                className="mt-1 flex items-center justify-between gap-1 w-full text-sm font-bold text-foreground"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{fromChain.logo}</span>
                  <span className="truncate">{fromChain.name.split(" ")[0]}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapChains}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-md transition hover:scale-110 active:scale-95 hover:border-primary"
            >
              <ArrowRight className="h-4 w-4 text-primary" />
            </button>

            {/* To Chain */}
            <div className="rounded-2xl border border-border bg-background/60 p-3 text-left">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">To Network</span>
              <button
                onClick={() => setShowToSelect(true)}
                className="mt-1 flex items-center justify-between gap-1 w-full text-sm font-bold text-foreground"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{toChain.logo}</span>
                  <span className="truncate">{toChain.name.split(" ")[0]}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </div>
          </div>

          {/* AMOUNT INPUT BOX */}
          <div className="rounded-2xl border border-border bg-background/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bridge Amount</span>
              <span className="text-xs font-semibold text-primary">{assetSymbol}</span>
            </div>
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full bg-transparent text-2xl font-bold text-foreground outline-none"
            />
          </div>

          {/* PROVIDERS LIST */}
          {providers.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Select Bridge Provider</span>
                <span className="text-[10px] text-primary flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Real-time Relayers
                </span>
              </div>

              <div className="space-y-2">
                {providers.map((p) => {
                  const isSelected = selectedProvider?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProvider(p)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-xs transition ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-background/40 hover:bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{p.logo}</span>
                        <div className="text-left">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.isFastest && (
                              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                                FASTEST
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Est. ~{p.estimatedTimeMins} mins • Fee: ${p.bridgeFeeUsd.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-semibold text-foreground">
                        ${(p.bridgeFeeUsd + p.gasFeeUsd).toFixed(2)} Total
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBMIT BRIDGE BUTTON */}
          <button
            onClick={handleExecuteBridge}
            disabled={isBridging || !selectedProvider || !parseFloat(amount)}
            className="w-full rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-blue-600 py-4 font-bold text-white shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isBridging ? "Bridging Assets Across Chains..." : `Bridge to ${toChain.name.split(" ")[0]}`}
          </button>
        </div>
      </div>

      {/* CHAIN SELECT MODALS */}
      <ChainSelectModal
        isOpen={showFromSelect}
        onClose={() => setShowFromSelect(false)}
        onSelect={(chain) => {
          if (chain.id === toChain.id) handleSwapChains();
          else setFromChain(chain);
          setShowFromSelect(false);
        }}
        chains={SUPPORTED_BRIDGE_CHAINS}
        title="Select Source Network"
      />

      <ChainSelectModal
        isOpen={showToSelect}
        onClose={() => setShowToSelect(false)}
        onSelect={(chain) => {
          if (chain.id === fromChain.id) handleSwapChains();
          else setToChain(chain);
          setShowToSelect(false);
        }}
        chains={SUPPORTED_BRIDGE_CHAINS}
        title="Select Destination Network"
      />

      {/* RESULT MODAL */}
      <AnimatePresence>
        {bridgeResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-primary/30 bg-zinc-950 p-6 text-center text-foreground shadow-2xl"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Bridge Order Submitted!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Relaying {bridgeResult.amount} {bridgeResult.assetSymbol} from {bridgeResult.fromChain} to{" "}
                {bridgeResult.toChain} via {bridgeResult.provider}.
              </p>

              <button
                onClick={() => setBridgeResult(null)}
                className="mt-6 w-full rounded-2xl bg-primary py-3 text-xs font-bold text-black"
              >
                Close & Track Progress
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ChainSelectModal({
  isOpen,
  onClose,
  onSelect,
  chains,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (c: ChainOption) => void;
  chains: ChainOption[];
  title: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => onSelect(chain)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-3 text-left transition hover:border-primary/50 hover:bg-background"
            >
              <span className="text-xl">{chain.logo}</span>
              <div>
                <div className="font-bold text-foreground text-sm">{chain.name}</div>
                <div className="text-xs text-muted-foreground">Chain ID: {chain.chainId}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
