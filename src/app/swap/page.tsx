"use client";

import React, { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  ArrowDownUp,
  Settings2,
  Zap,
  Info,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import {
  SwapService,
  SUPPORTED_SWAP_TOKENS,
  TokenItem,
  DexRoute,
  SwapQuoteRequest,
  SwapExecutionResult,
} from "@/services/swap.service";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SwapPage() {
  const [fromToken, setFromToken] = useState<TokenItem>(SUPPORTED_SWAP_TOKENS[0]); // ETH
  const [toToken, setToToken] = useState<TokenItem>(SUPPORTED_SWAP_TOKENS[2]); // USDC
  const [amountIn, setAmountIn] = useState<string>("0.5");
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%
  const [customSlippage, setCustomSlippage] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [routes, setRoutes] = useState<DexRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<DexRoute | null>(null);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<SwapExecutionResult | null>(null);

  const [showFromSelect, setShowFromSelect] = useState<boolean>(false);
  const [showToSelect, setShowToSelect] = useState<boolean>(false);

  // Recalculate quotes when tokens or amount change
  useEffect(() => {
    const num = parseFloat(amountIn);
    if (!num || num <= 0) {
      setRoutes([]);
      setSelectedRoute(null);
      return;
    }

    setIsQuoting(true);
    const timer = setTimeout(() => {
      const quoteReq: SwapQuoteRequest = {
        fromToken,
        toToken,
        amountIn: num,
        slippageTolerance: slippage,
      };
      const fetchedRoutes = SwapService.getAggregatedQuotes(quoteReq);
      setRoutes(fetchedRoutes);
      if (fetchedRoutes.length > 0) {
        setSelectedRoute(fetchedRoutes[0]); // best route default
      } else {
        setSelectedRoute(null);
      }
      setIsQuoting(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [fromToken, toToken, amountIn, slippage]);

  const handleFlipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleMaxClick = () => {
    setAmountIn(fromToken.balance.toString());
  };

  const handleExecuteSwap = async () => {
    const num = parseFloat(amountIn);
    if (!num || num <= 0 || !selectedRoute) return;

    if (num > fromToken.balance) {
      toast.error(`Insufficient ${fromToken.symbol} balance.`);
      return;
    }

    setIsSwapping(true);
    try {
      const res = await SwapService.executeSwap(
        {
          fromToken,
          toToken,
          amountIn: num,
          slippageTolerance: slippage,
        },
        selectedRoute
      );
      if (res.success) {
        setSwapResult(res);
        toast.success(`Successfully swapped ${res.amountIn} ${res.fromSymbol}!`);
        // Update local balance simulation
        setFromToken((prev) => ({
          ...prev,
          balance: Math.max(0, prev.balance - num),
        }));
        setToToken((prev) => ({
          ...prev,
          balance: prev.balance + res.amountOut,
        }));
      }
    } catch (err: any) {
      toast.error(err.message || "Swap execution failed.");
    } finally {
      setIsSwapping(false);
    }
  };

  const amountOut = selectedRoute ? selectedRoute.amountOut.toFixed(4) : "0.00";
  const rateDisplay = selectedRoute
    ? `1 ${fromToken.symbol} ≈ ${selectedRoute.rate.toFixed(4)} ${toToken.symbol}`
    : "";

  return (
    <main className="min-h-screen bg-background pb-24">
      <ActionPageHeader title="Token Swap & DEX Aggregator" backHref="/" />

      <div className="container mt-4 max-w-md space-y-5 px-4">
        {/* Header Title Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4 animate-pulse fill-primary" />
            <span className="font-semibold">Best Route Aggregator</span>
          </div>
          <span className="text-muted-foreground">0.0% GoFlazz Fee</span>
        </div>

        {/* Swap Card Box */}
        <div className="relative rounded-3xl border border-border bg-card p-4 shadow-xl">
          {/* Top Row: Settings */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pay Amount
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>{slippage}% Slippage</span>
            </button>
          </div>

          {/* Slippage Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden rounded-2xl border border-border bg-background/60 p-3 text-xs"
              >
                <div className="mb-2 font-medium text-foreground">Slippage Tolerance</div>
                <div className="flex items-center gap-2">
                  {[0.1, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setSlippage(val);
                        setCustomSlippage("");
                      }}
                      className={`flex-1 rounded-xl py-1.5 font-semibold transition ${
                        slippage === val && !customSlippage
                          ? "bg-primary text-black"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="Custom"
                      value={customSlippage}
                      onChange={(e) => {
                        setCustomSlippage(e.target.value);
                        const parsed = parseFloat(e.target.value);
                        if (parsed > 0 && parsed <= 50) {
                          setSlippage(parsed);
                        }
                      }}
                      className="w-full rounded-xl border border-border bg-card px-2 py-1.5 text-center font-medium text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOKEN IN INPUT BOX */}
          <div className="rounded-2xl border border-border bg-background/50 p-3.5 transition focus-within:border-primary">
            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <button
                onClick={() => setShowFromSelect(true)}
                className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold shadow-sm hover:border-primary/50"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: fromToken.color }}
                >
                  {fromToken.symbol[0]}
                </span>
                <span>{fromToken.symbol}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                ≈ $
                {((parseFloat(amountIn) || 0) * fromToken.priceUsd).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <span>Balance: {fromToken.balance.toLocaleString()}</span>
                <button
                  onClick={handleMaxClick}
                  className="font-bold text-primary hover:underline uppercase"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* FLIP BUTTON */}
          <div className="relative my-[-10px] z-10 flex justify-center">
            <button
              onClick={handleFlipTokens}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-lg transition hover:scale-110 active:scale-95 hover:border-primary"
            >
              <ArrowDownUp className="h-4 w-4 text-primary" />
            </button>
          </div>

          {/* TOKEN OUT ESTIMATE BOX */}
          <div className="rounded-2xl border border-border bg-background/50 p-3.5 pt-4 transition">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Receive (Estimated)
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-bold text-foreground">
                {isQuoting ? (
                  <span className="animate-pulse text-muted-foreground">Calculating...</span>
                ) : (
                  amountOut
                )}
              </div>
              <button
                onClick={() => setShowToSelect(true)}
                className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold shadow-sm hover:border-primary/50"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: toToken.color }}
                >
                  {toToken.symbol[0]}
                </span>
                <span>{toToken.symbol}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                ≈ $
                {(
                  (parseFloat(amountOut) || 0) * toToken.priceUsd
                ).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </span>
              <span>Rate: {rateDisplay}</span>
            </div>
          </div>

          {/* DEX AGGREGATED ROUTES COMPARISON */}
          {routes.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Aggregated DEX Routes</span>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Best Price Guaranteed
                </span>
              </div>

              <div className="space-y-1.5">
                {routes.map((route, idx) => {
                  const isSelected = selectedRoute?.dexName === route.dexName;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedRoute(route)}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-xs transition ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-background/40 hover:bg-background/80"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{route.dexLogo}</span>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <span>{route.dexName}</span>
                            {route.isBestRate && (
                              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                BEST RATE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Gas: ${route.estimatedGasUsd.toFixed(2)} • Impact: {route.priceImpactPercent}%
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          {route.amountOut.toFixed(4)} {toToken.symbol}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          ≈ ${route.amountOutUsd.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXECUTE SWAP BUTTON */}
          <button
            onClick={handleExecuteSwap}
            disabled={
              isSwapping ||
              isQuoting ||
              !selectedRoute ||
              !parseFloat(amountIn) ||
              parseFloat(amountIn) > fromToken.balance
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-blue-600 py-4 font-bold text-white shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSwapping ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Swapping Tokens...</span>
              </div>
            ) : parseFloat(amountIn) > fromToken.balance ? (
              <span>Insufficient {fromToken.symbol} Balance</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-5 w-5" />
                <span>Swap via {selectedRoute?.dexName || "Aggregator"}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* TOKEN SELECTOR MODALS */}
      <TokenSelectModal
        isOpen={showFromSelect}
        onClose={() => setShowFromSelect(false)}
        onSelect={(token) => {
          if (token.id === toToken.id) handleFlipTokens();
          else setFromToken(token);
          setShowFromSelect(false);
        }}
        tokens={SUPPORTED_SWAP_TOKENS}
        title="Select Pay Token"
      />

      <TokenSelectModal
        isOpen={showToSelect}
        onClose={() => setShowToSelect(false)}
        onSelect={(token) => {
          if (token.id === fromToken.id) handleFlipTokens();
          else setToToken(token);
          setShowToSelect(false);
        }}
        tokens={SUPPORTED_SWAP_TOKENS}
        title="Select Receive Token"
      />

      {/* SWAP RESULT SUCCESS MODAL */}
      <AnimatePresence>
        {swapResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-primary/30 bg-zinc-950 p-6 text-center text-foreground shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold">Swap Executed!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Swapped {swapResult.amountIn} {swapResult.fromSymbol} for {swapResult.amountOut.toFixed(4)}{" "}
                {swapResult.toSymbol} via {swapResult.routeUsed}
              </p>

              <div className="my-4 rounded-2xl border border-border bg-card p-3 text-left text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tx Hash</span>
                  <span className="font-mono text-foreground">
                    {swapResult.txHash?.slice(0, 8)}...{swapResult.txHash?.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Network</span>
                  <span className="text-foreground">Ethereum Mainnet</span>
                </div>
              </div>

              <button
                onClick={() => setSwapResult(null)}
                className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-black"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function TokenSelectModal({
  isOpen,
  onClose,
  onSelect,
  tokens,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (t: TokenItem) => void;
  tokens: TokenItem[];
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

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {tokens.map((token) => (
            <button
              key={token.id}
              onClick={() => onSelect(token)}
              className="flex w-full items-center justify-between rounded-2xl border border-border/50 bg-background/50 p-3 transition hover:border-primary/50 hover:bg-background"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: token.color }}
                >
                  {token.symbol[0]}
                </div>
                <div className="text-left">
                  <div className="font-bold text-foreground">{token.name}</div>
                  <div className="text-xs text-muted-foreground">{token.symbol}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-foreground">{token.balance.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">${token.priceUsd.toLocaleString()}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
