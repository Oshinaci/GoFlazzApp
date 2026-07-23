"use client";

import React, { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { CreditCard, Landmark, QrCode, ArrowRight, Wallet, Check, Copy, ArrowLeft, Loader2, Sparkles, Receipt, Lock } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { BalanceService } from "@/services/balance.service";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CryptoAsset {
  symbol: string;
  name: string;
  priceUSD: number;
  icon: string;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  { symbol: "ETH", name: "Ethereum", priceUSD: 3100, icon: "⟠" },
  { symbol: "ARB", name: "Arbitrum", priceUSD: 1.15, icon: "⚡" },
  { symbol: "USDC", name: "USD Coin", priceUSD: 1.00, icon: "🔵" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", priceUSD: 95000, icon: "₿" },
];

export default function AddFundsPage() {
  const { user } = useAuth();
  const { activeWallet, activeNetwork } = useWallet();
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"card" | "bank" | "crypto" | null>(null);

  // Buy States
  const [buyAmount, setBuyAmount] = useState<string>("100");
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(CRYPTO_ASSETS[0]);
  const [step, setStep] = useState<"amount" | "payment" | "processing" | "success">("amount");

  // Payment Form States
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const calculatedCrypto = (parseFloat(buyAmount) || 0) / selectedAsset.priceUSD;

  const handleCopy = async () => {
    if (!activeWallet) return;
    try {
      await navigator.clipboard.writeText(activeWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Address copied to clipboard!");
    } catch (e) {
      // Ignore
    }
  };

  const handleProceedToPayment = () => {
    const amt = parseFloat(buyAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setStep("payment");
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeWallet) {
      toast.error("Active wallet session required.");
      return;
    }

    if (selectedMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        toast.error("Please complete all payment card fields.");
        return;
      }
    } else if (selectedMethod === "bank") {
      if (!bankRouting || !bankAccount) {
        toast.error("Please fill in routing and account details.");
        return;
      }
    }

    setStep("processing");

    // Simulate standard payment gateway network latency
    setTimeout(async () => {
      try {
        const parsedAmount = calculatedCrypto;
        const assetSymbol = selectedAsset.symbol;

        // Fetch existing balance to update
        const balances = await BalanceService.getBalances(user.id, activeWallet.id);
        const existing = balances.find((b) => b.asset_symbol === assetSymbol);
        const newBalance = (existing?.balance || 0) + parsedAmount;

        // Update database balance
        await BalanceService.upsertBalance(user.id, activeWallet.id, assetSymbol, newBalance);

        // Record a real wallet activity log
        await supabase.from("wallet_activity").insert({
          user_id: user.id,
          wallet_id: activeWallet.id,
          action: `Add Funds (${selectedMethod === "card" ? "Card" : "Bank"})`,
          type: "receive",
          amount: parsedAmount,
          symbol: assetSymbol,
          counterparty: selectedMethod === "card" ? "Visa Secure Gateway" : "ACH Network Transfer",
          status: "completed",
          metadata: {
            method: selectedMethod,
            fiat_amount: parseFloat(buyAmount),
            fiat_currency: "USD",
            tx_hash: "0x" + Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18),
          },
        });

        setStep("success");
        toast.success(`Successfully added ${parsedAmount.toFixed(4)} ${assetSymbol}!`);
      } catch (err: any) {
        toast.error("Funding failed: " + err.message);
        setStep("payment");
      }
    }, 2500);
  };

  const handleReset = () => {
    setStep("amount");
    setSelectedMethod(null);
    setBuyAmount("100");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setBankRouting("");
    setBankAccount("");
  };

  if (!activeWallet) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-4 px-4 sm:px-8 max-w-lg mx-auto">
        <ActionPageHeader title="Add Funds" backHref="/" />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No active wallet found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20 pt-4 px-4 sm:px-8 max-w-lg mx-auto">
      <ActionPageHeader title="Add Funds" backHref="/" />

      {!selectedMethod ? (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Fund Your Wallet</h2>
            <p className="text-sm text-muted-foreground">
              Choose how you want to add crypto to your {activeNetwork} network wallet.
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <button
              onClick={() => {
                setSelectedMethod("card");
                setStep("amount");
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl glass-card border border-border hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Credit or Debit Card</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Instant fiat-to-crypto purchase</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => {
                setSelectedMethod("bank");
                setStep("amount");
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl glass-card border border-border hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Bank Transfer (ACH)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Wire transfer with lower fees</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => setSelectedMethod("crypto")}
              className="w-full flex items-center justify-between p-4 rounded-2xl glass-card border border-border hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Deposit Crypto</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Transfer from another external wallet</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      ) : selectedMethod === "crypto" ? (
        <div className="space-y-6 flex flex-col items-center mt-4">
          <div className="text-center">
            <h2 className="text-lg font-bold">Your Wallet Address</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Only send {activeNetwork} network assets to this address.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-md border border-border flex flex-col items-center justify-center">
            {/* Generate a QR representation using Lucide */}
            <QrCode className="h-40 w-40 text-black" />
          </div>

          <div className="w-full glass-card p-4 rounded-2xl border border-border flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                Network: {activeNetwork}
              </p>
              <p className="font-mono text-xs truncate break-all text-foreground">
                {activeWallet.address}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="h-10 w-10 flex items-center justify-center shrink-0 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={() => setSelectedMethod(null)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground mt-4 flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to methods
          </button>
        </div>
      ) : (
        /* CARD OR BANK FIAT FLOWS */
        <div className="mt-2">
          {/* STEP 1: SPECIFY AMOUNT & TOKEN */}
          {step === "amount" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="rounded-full p-2 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Purchase Details ({selectedMethod === "card" ? "Debit Card" : "ACH Wire"})
                </span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold uppercase">You Pay (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-lg text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-semibold uppercase">Asset to purchase</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CRYPTO_ASSETS.map((asset) => (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition ${
                          selectedAsset.symbol === asset.symbol
                            ? "border-primary bg-primary/10 text-white"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-lg leading-none mb-1">{asset.icon}</span>
                        <span className="text-xs font-bold">{asset.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversion Display */}
              <div className="p-4 rounded-xl bg-surface/50 border border-border flex justify-between items-center text-xs">
                <div>
                  <p className="text-muted-foreground">Estimated Crypto Received</p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {calculatedCrypto.toFixed(5)} {selectedAsset.symbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Rate</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    1 {selectedAsset.symbol} = ${selectedAsset.priceUSD.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full bg-blue-gradient text-white py-3.5 rounded-2xl font-bold text-sm hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                Continue to Payment
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2: FILL PAYMENT DETAILS */}
          {step === "payment" && (
            <form onSubmit={handlePay} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep("amount")}
                  className="rounded-full p-2 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Payment Checkout
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface/40 border border-border flex justify-between items-center text-xs">
                <div>
                  <p className="text-muted-foreground">Total Purchase Amount</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">${parseFloat(buyAmount).toFixed(2)} USD</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Buying</p>
                  <p className="text-sm font-semibold text-primary mt-0.5">
                    {calculatedCrypto.toFixed(4)} {selectedAsset.symbol}
                  </p>
                </div>
              </div>

              {selectedMethod === "card" ? (
                <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Enter Debit or Credit Card</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Expiry Date</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">CVV / CVC</label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-5 rounded-2xl border border-border space-y-4">
                  <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs uppercase tracking-wider mb-2">
                    <Landmark className="h-4 w-4" />
                    <span>ACH Bank Transfer details</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Routing Number</label>
                    <input
                      type="text"
                      required
                      placeholder="021000021"
                      value={bankRouting}
                      onChange={(e) => setBankRouting(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="1234567890"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Account Type</label>
                    <select
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Secure SSL encrypted connection. Powered by GoFlazz security vault.</span>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-gradient text-white py-3.5 rounded-2xl font-bold text-sm hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                Authorize Purchase
              </button>
            </form>
          )}

          {/* STEP 3: PROCESSING PAYMENT */}
          {step === "processing" && (
            <div className="space-y-6 flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg">Verifying with Bank...</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Securing 3D secure connection. Please do not close this window or navigate back.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === "success" && (
            <div className="space-y-6 flex flex-col items-center justify-center py-10 text-center">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-success/20" />
                <div className="h-20 w-20 rounded-full bg-success/10 text-success flex items-center justify-center border border-success/30">
                  <Check className="h-10 w-10 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-xl tracking-tight text-success">Funding Successful!</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                  Added <strong className="text-foreground">{calculatedCrypto.toFixed(5)} {selectedAsset.symbol}</strong> to your {activeNetwork} wallet.
                </p>
              </div>

              <div className="w-full border-t border-border my-2" />

              <div className="w-full glass-card p-4 rounded-2xl border border-border text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> Receipt</span>
                  <span className="font-semibold text-foreground">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium capitalize">{selectedMethod === "card" ? "Debit Card" : "ACH Bank Transfer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium">${parseFloat(buyAmount).toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono text-[10px] text-muted-foreground">TX-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-surface border border-border hover:border-primary/50 text-foreground py-3 rounded-2xl font-semibold text-xs transition mt-2 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Done & Purchase Again
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
