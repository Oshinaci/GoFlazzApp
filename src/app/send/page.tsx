"use client";

import { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { ContactsService, ContactRecord } from "@/services/contacts.service";
import { TransactionIntent, TransactionReview, SendStep } from "@/services/transaction/transaction.types";
import { TransactionValidator } from "@/services/transaction/transactionValidator";
import { TransactionBuilder } from "@/services/transaction/transactionBuilder";
import { AddressValidator } from "@/services/transaction/addressValidator";
import QrScannerModal from "@/components/transaction/QrScannerModal";
import PinAuthorizationModal from "@/components/transaction/PinAuthorizationModal";
import { toast } from "sonner";
import {
  Send,
  AlertCircle,
  QrCode,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  DollarSign,
  Info,
  ShieldCheck,
  Search,
  Star,
  X,
  Camera,
  Check,
} from "lucide-react";

export default function SendPage() {
  const { user } = useAuth();
  const { activeWallet, activeNetwork } = useWallet();
  const { balances, loading: balancesLoading } = useWalletBalances(activeWallet?.id);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);

  // Send Flow State
  const [step, setStep] = useState<SendStep>("asset");
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>("ETH");
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  // Modals
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [contactSearch, setContactSearch] = useState<string>("");
  const [qrInputUri, setQrInputUri] = useState<string>("");

  // Validation & Review
  const [validationResult, setValidationResult] = useState<any>(null);
  const [reviewData, setReviewData] = useState<TransactionReview | null>(null);

  // Load contacts on mount
  useEffect(() => {
    async function loadContacts() {
      if (activeWallet) {
        const list = await ContactsService.getContacts(activeWallet.id);
        setContacts(list);
      }
    }
    loadContacts();
  }, [activeWallet]);

  // Normalized Assets list
  const normalizedAssets = balances.length > 0 ? balances.map((b) => ({
    id: b.id || b.asset_symbol,
    symbol: b.asset_symbol,
    name: b.asset_symbol === "ETH" ? "Ethereum" : b.asset_symbol === "USDC" ? "USD Coin" : b.asset_symbol === "USDT" ? "Tether USD" : b.asset_symbol,
    balance: b.balance,
    contract_address: b.token_address,
  })) : [
    { id: "eth", symbol: "ETH", name: "Ethereum", balance: 1.245, contract_address: null },
    { id: "usdc", symbol: "USDC", name: "USD Coin", balance: 450.00, contract_address: null },
  ];

  const currentAsset = normalizedAssets.find((a) => a.symbol.toUpperCase() === selectedAssetSymbol.toUpperCase()) || normalizedAssets[0];
  const availableBalance = currentAsset.balance;

  // Handle Asset Selection
  const handleSelectAsset = (symbol: string) => {
    setSelectedAssetSymbol(symbol);
    setStep("recipient");
  };

  // Handle Recipient Next
  const handleRecipientNext = () => {
    const res = AddressValidator.validate(recipient, activeWallet?.address);
    if (!res.isValid) {
      toast.error(res.error || "Invalid recipient address.");
      return;
    }
    if (res.warning) {
      toast.info(res.warning);
    }
    setStep("amount");
  };

  // Handle Amount Next -> Build Review
  const handleAmountNext = () => {
    const numAmount = parseFloat(amount);
    const intent: TransactionIntent = {
      userId: activeWallet?.id || "default",
      walletAddress: activeWallet?.address || "0x7F2...3E1",
      chainId: activeNetwork === "arbitrum" ? 42161 : 1,
      assetSymbol: currentAsset.symbol,
      assetName: currentAsset.name,
      assetContractAddress: currentAsset.contract_address || null,
      recipientAddress: recipient.trim(),
      amount: isNaN(numAmount) ? 0 : numAmount,
      decimals: 18,
      networkName: activeNetwork || "Arbitrum One",
      memo: memo.trim() || undefined,
    };

    const val = TransactionValidator.validate(intent, availableBalance);
    setValidationResult(val);

    if (!val.isValid) {
      toast.error(val.errors[0] || "Please check your inputs.");
      return;
    }

    // Build Review
    const priceUsd = currentAsset.symbol === "ETH" ? 3250.40 : currentAsset.symbol === "USDC" || currentAsset.symbol === "USDT" ? 1.00 : 14.50;
    const review = TransactionBuilder.buildReview(intent, priceUsd);
    setReviewData(review);
    setStep("review");
  };

  // Handle QR Scan Simulate
  const handleSimulateQrScan = (sampleUriOrAddress: string) => {
    const parsed = AddressValidator.parseEip681(sampleUriOrAddress);
    setRecipient(parsed.address);
    if (parsed.amount) {
      setAmount(parsed.amount);
    }
    setShowQrModal(false);
    toast.success("QR Code scanned & parsed successfully!");
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.address.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.label && c.label.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-background pb-28 pt-4">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        <ActionPageHeader title="Send Assets" backHref="/" />

        {/* Read-Only Simulation Banner */}
        <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">
            <span className="font-bold">Transaction Preparation Engine (Phase 3.8):</span> Fully interactive read-only simulation. No private keys exposed, no gas spent, and no transactions broadcasted to the blockchain.
          </div>
        </div>

        {/* Stepper Progress Header */}
        <div className="grid grid-cols-4 gap-1.5 px-1">
          <div className={`h-1.5 rounded-full transition-colors ${["asset", "recipient", "amount", "review"].includes(step) ? "bg-primary" : "bg-border"}`} />
          <div className={`h-1.5 rounded-full transition-colors ${["recipient", "amount", "review"].includes(step) ? "bg-primary" : "bg-border"}`} />
          <div className={`h-1.5 rounded-full transition-colors ${["amount", "review"].includes(step) ? "bg-primary" : "bg-border"}`} />
          <div className={`h-1.5 rounded-full transition-colors ${step === "review" ? "bg-primary" : "bg-border"}`} />
        </div>

        {/* STEP 1: CHOOSE ASSET */}
        {step === "asset" && (
          <div className="rounded-[22px] bg-card border border-border/80 p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-foreground">Step 1: Choose Asset</h2>
              <span className="text-[12px] font-medium text-muted-foreground">Arbitrum One</span>
            </div>

            {balancesLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading wallet assets...</div>
            ) : (
              <div className="space-y-2">
                {normalizedAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelectAsset(asset.symbol)}
                    className="w-full flex items-center justify-between p-3.5 rounded-[16px] border border-border/60 bg-card-secondary hover:border-primary/50 hover:bg-accent/5 transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-105 transition-transform">
                        {asset.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-foreground">{asset.name}</div>
                        <div className="text-[12px] text-muted-foreground">{asset.symbol} • Arbitrum</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-foreground">{asset.balance.toFixed(4)}</div>
                      <div className="text-[11px] text-muted-foreground">${(asset.balance * (asset.symbol === "ETH" ? 3250 : 1)).toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: RECIPIENT ADDRESS */}
        {step === "recipient" && (
          <div className="rounded-[22px] bg-card border border-border/80 p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-foreground">Step 2: Recipient Address</h2>
              <button
                type="button"
                onClick={() => setStep("asset")}
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                Change Asset ({currentAsset.symbol})
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-muted-foreground">To Address or ENS</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/10 px-2 py-1 rounded-lg"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Scan QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactsModal(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/10 px-2 py-1 rounded-lg"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Contacts</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x... EVM Address, ENS name, or EIP-681 URI"
                className="w-full rounded-[14px] border border-border/80 bg-card-secondary p-3 text-[13px] font-medium text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60 resize-none font-mono"
              />
            </div>

            {/* Quick Contacts Pills */}
            {contacts.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recent Contacts</span>
                <div className="flex flex-wrap gap-1.5">
                  {contacts.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRecipient(c.address)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/80 bg-card-secondary text-[12px] font-medium hover:border-primary transition"
                    >
                      <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                        {c.name.charAt(0)}
                      </div>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("asset")}
                className="w-1/3 flex items-center justify-center gap-1.5 rounded-[14px] border border-border/80 py-3 text-[13px] font-bold text-foreground hover:bg-card-secondary transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleRecipientNext}
                className="w-2/3 flex items-center justify-center gap-2 rounded-[14px] bg-primary py-3 text-[13px] font-bold text-white shadow-sm hover:bg-primary/90 transition"
              >
                <span>Continue to Amount</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ENTER AMOUNT */}
        {step === "amount" && (
          <div className="rounded-[22px] bg-card border border-border/80 p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-foreground">Step 3: Enter Amount</h2>
              <button
                type="button"
                onClick={() => setStep("recipient")}
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                Edit Recipient
              </button>
            </div>

            <div className="rounded-[16px] bg-card-secondary p-3 border border-border/60 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-muted-foreground font-medium">Selected Asset</div>
                <div className="text-[14px] font-bold text-foreground flex items-center gap-1.5">
                  <span>{currentAsset.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{currentAsset.symbol}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-foreground font-medium">Available Balance</div>
                <div className="text-[14px] font-bold text-foreground">{availableBalance.toFixed(4)} {currentAsset.symbol}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-semibold text-muted-foreground">Transfer Amount</label>
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance.toString())}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Max ({availableBalance.toFixed(4)} {currentAsset.symbol})
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-[14px] border border-border/80 bg-card-secondary px-3.5 py-3 text-[18px] font-bold text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60 pr-20"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-muted-foreground">
                  {currentAsset.symbol}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-muted-foreground">Optional Memo / Note</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="e.g. Coffee bill, rent share..."
                className="w-full rounded-[14px] border border-border/80 bg-card-secondary px-3.5 py-2.5 text-[13px] font-medium text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("recipient")}
                className="w-1/3 flex items-center justify-center gap-1.5 rounded-[14px] border border-border/80 py-3 text-[13px] font-bold text-foreground hover:bg-card-secondary transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleAmountNext}
                className="w-2/3 flex items-center justify-center gap-2 rounded-[14px] bg-primary py-3 text-[13px] font-bold text-white shadow-sm hover:bg-primary/90 transition"
              >
                <span>Review Transaction</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW TRANSACTION & READY FOR CONFIRMATION */}
        {step === "review" && reviewData && (
          <div className="rounded-[22px] bg-card border border-border/80 p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-foreground">Step 4: Review Transaction</h2>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Simulation Ready
              </span>
            </div>

            {/* Main Summary Card */}
            <div className="rounded-[18px] border border-border/80 bg-card-secondary p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                <span className="text-[13px] text-muted-foreground font-medium">Network</span>
                <span className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                  <span>⚡</span> Arbitrum One (L2)
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                <span className="text-[13px] text-muted-foreground font-medium">Asset</span>
                <span className="text-[13px] font-bold text-foreground">
                  {reviewData.intent.amount} {reviewData.intent.assetSymbol}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                <span className="text-[13px] text-muted-foreground font-medium">Recipient</span>
                <span className="text-[12px] font-mono font-medium text-primary max-w-[200px] truncate" title={reviewData.intent.recipientAddress}>
                  {reviewData.intent.recipientAddress}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                <span className="text-[13px] text-muted-foreground font-medium">Estimated Gas Fee</span>
                <span className="text-[13px] font-bold text-foreground">
                  {reviewData.feeEstimate.estimatedFeeNative} ETH (~${reviewData.feeEstimate.estimatedFeeUsd.toFixed(4)})
                </span>
              </div>

              {reviewData.intent.memo && (
                <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                  <span className="text-[13px] text-muted-foreground font-medium">Memo</span>
                  <span className="text-[13px] font-medium text-foreground">{reviewData.intent.memo}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-[14px] font-bold text-foreground">Total Estimated Cost</span>
                <span className="text-[15px] font-extrabold text-primary">
                  ${reviewData.totalUsdCost.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Warnings if any */}
            {reviewData.warnings.length > 0 && (
              <div className="rounded-[14px] border border-amber-500/20 bg-amber-500/10 p-3 space-y-1">
                {reviewData.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[12px] font-medium text-amber-600 dark:text-amber-300">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Ready for Execution Notice */}
            <div className="rounded-[14px] border border-border/80 bg-card p-3 text-center space-y-1">
              <div className="text-[12px] font-bold text-foreground flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Ready for Real Transaction Execution (Phase 3.9)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Enter your security PIN to decrypt your keystore, sign offline with EIP-155 replay protection, and broadcast directly to Arbitrum One.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("amount")}
                className="w-1/3 flex items-center justify-center gap-1.5 rounded-[14px] border border-border/80 py-3 text-[13px] font-bold text-foreground hover:bg-card-secondary transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="w-2/3 flex items-center justify-center gap-2 rounded-[14px] bg-primary py-3 text-[13px] font-bold text-white shadow-sm hover:bg-primary/90 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Authorize & Sign Transaction</span>
              </button>
            </div>
          </div>
        )}

        {/* PIN AUTHORIZATION & EXECUTION MODAL */}
        {reviewData && (
          <PinAuthorizationModal
            isOpen={showPinModal}
            onClose={() => setShowPinModal(false)}
            userId={user?.id || "default"}
            walletId={activeWallet?.id || "default"}
            intent={reviewData.intent}
            review={reviewData}
            onSuccess={(hash) => {
              setShowPinModal(false);
              setStep("asset");
              setRecipient("");
              setAmount("");
              setMemo("");
              setReviewData(null);
            }}
          />
        )}

        {/* ADDRESS BOOK CONTACTS MODAL */}
        {showContactsModal && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[24px] border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">Select from Address Book</h3>
                <button
                  type="button"
                  onClick={() => setShowContactsModal(false)}
                  className="h-8 w-8 rounded-full bg-card-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts by name or address..."
                  className="w-full rounded-[14px] border border-border/80 bg-card-secondary pl-10 pr-3.5 py-2 text-[13px] font-medium text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {filteredContacts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No contacts found.</div>
                ) : (
                  filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setRecipient(c.address);
                        setShowContactsModal(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-[14px] border border-border/60 bg-card-secondary hover:border-primary transition text-left"
                    >
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{c.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[240px]">{c.address}</div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{c.label || "Contact"}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR SCANNER MODAL */}
        <QrScannerModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          onScanSuccess={(addr, amt, sym) => {
            setRecipient(addr);
            if (amt) setAmount(amt);
            if (sym) setSelectedAssetSymbol(sym);
          }}
        />
      </div>
    </main>
  );
}
