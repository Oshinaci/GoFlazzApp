"use client";

import { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { useWallet } from "@/hooks/useWallet";
import { ReceiveService } from "@/services/receive/receive.service";
import { QrGenerator } from "@/services/receive/qrGenerator";
import { ShareService } from "@/services/receive/share.service";
import { NetworkOption } from "@/services/receive/receive.types";
import {
  Copy,
  Check,
  QrCode,
  Share2,
  ShieldCheck,
  Wallet,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ReceivePage() {
  const { activeWallet, wallets, selectWallet } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption>(ReceiveService.getSupportedNetworks()[0]);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [lastCopyTime, setLastCopyTime] = useState<number>(0);
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferSymbol, setTransferSymbol] = useState<string>("ETH");

  const address = activeWallet?.address || "0x7F2B3E19C82A4D12891938BC1982B1892837BC19";
  const walletName = activeWallet?.name || "GoFlazz Primary Wallet";

  // Generate QR code whenever address, network, or amount changes
  useEffect(() => {
    async function updateQr() {
      try {
        const uri = QrGenerator.generateEip681Uri(
          address,
          selectedNetwork.chainId,
          transferAmount ? transferAmount : undefined,
          transferAmount ? transferSymbol : undefined
        );
        const url = await QrGenerator.generateDataUrl(uri, 320);
        setQrDataUrl(url);
      } catch (err) {
        console.error("[ReceivePage] QR generation error:", err);
      }
    }
    updateQr();
  }, [address, selectedNetwork, transferAmount, transferSymbol]);

  // Handle copy with rapid tap prevention
  const handleCopy = async () => {
    const now = Date.now();
    if (now - lastCopyTime < 1000) {
      toast.info("Please wait a moment before copying again.");
      return;
    }
    setLastCopyTime(now);

    const success = await ShareService.copyToClipboard(address, "Wallet address copied successfully!");
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Handle native share
  const handleShare = async () => {
    await ShareService.nativeShare(
      `Receive ${selectedNetwork.nativeCurrency} on ${selectedNetwork.name}`,
      `Send ${selectedNetwork.nativeCurrency} to my GoFlazz wallet (${walletName}): ${address}`,
      window.location.href
    );
  };

  const networks = ReceiveService.getSupportedNetworks();

  // If no wallet exists anywhere
  if (!activeWallet && wallets.length === 0) {
    return (
      <main className="min-h-screen bg-background pb-28 pt-4">
        <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
          <ActionPageHeader title="Receive Assets" backHref="/" />
          <div className="rounded-[22px] bg-card border border-border/80 p-6 text-center shadow-sm space-y-4 my-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Wallet className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[18px] font-bold text-foreground">No Wallet Found</h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                You need an active wallet to receive crypto assets securely on GoFlazz.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/onboarding"
                className="w-full py-3 rounded-[14px] bg-primary text-white text-[14px] font-bold shadow-sm hover:bg-primary/90 transition text-center"
              >
                Create New Wallet
              </Link>
              <Link
                href="/settings"
                className="w-full py-3 rounded-[14px] border border-border bg-card-secondary text-foreground text-[14px] font-bold hover:bg-accent/10 transition text-center"
              >
                Import Existing Wallet
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-28 pt-4">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        <ActionPageHeader title="Receive Assets" backHref="/" />

        {/* Network Selector & Active Wallet Header */}
        <div className="rounded-[22px] bg-card border border-border/80 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                {activeWallet?.name ? activeWallet.name.charAt(0).toUpperCase() : "G"}
              </div>
              <div>
                <div className="text-[14px] font-bold text-foreground">{walletName}</div>
                <div className="text-[11px] text-muted-foreground">Self-Custodial • Arbitrum One</div>
              </div>
            </div>

            {/* Network Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card-secondary text-[12px] font-bold text-foreground hover:border-primary transition"
              >
                <span>{selectedNetwork.iconName}</span>
                <span>{selectedNetwork.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {showNetworkDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-[20px] border border-border bg-card p-2 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select Network
                  </div>
                  {networks.map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => {
                        if (net.isActive) {
                          setSelectedNetwork(net);
                          setShowNetworkDropdown(false);
                        } else {
                          toast.info(`${net.name} network support coming soon in Phase 4.`);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-[13px] font-medium transition ${
                        selectedNetwork.id === net.id
                          ? "bg-primary/10 text-primary font-bold"
                          : net.isActive
                          ? "hover:bg-accent/10 text-foreground"
                          : "opacity-60 hover:bg-accent/5 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{net.iconName}</span>
                        <span>{net.name}</span>
                      </div>
                      {!net.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                          Soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center pt-2 pb-1 space-y-4">
            <div className="relative p-4 rounded-[24px] border-2 border-primary/20 bg-card-secondary shadow-lg group">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Wallet QR Code"
                  className="h-56 w-56 rounded-xl object-contain shadow-sm"
                />
              ) : (
                <div className="h-56 w-56 flex items-center justify-center text-muted-foreground">
                  <QrCode className="h-20 w-20 animate-pulse" />
                </div>
              )}
              <div className="absolute inset-0 rounded-[24px] border border-primary/40 pointer-events-none" />
            </div>

            <div className="text-center space-y-1">
              <div className="text-[12px] font-bold text-foreground">Scan QR to Send {selectedNetwork.nativeCurrency}</div>
              <p className="text-[11px] text-muted-foreground">
                Compatible with all EVM wallets & EIP-681 scanners.
              </p>
            </div>
          </div>

          {/* Optional Amount Request Builder */}
          <div className="rounded-[16px] border border-border/60 bg-card-secondary p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Request Specific Amount (Optional)</span>
              </span>
              {transferAmount && (
                <button
                  type="button"
                  onClick={() => setTransferAmount("")}
                  className="text-[11px] text-primary font-semibold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.00 amount"
                className="flex-1 rounded-[12px] border border-border bg-card px-3 py-2 text-[13px] font-bold text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
              />
              <select
                value={transferSymbol}
                onChange={(e) => setTransferSymbol(e.target.value)}
                className="rounded-[12px] border border-border bg-card px-3 py-2 text-[13px] font-bold text-foreground outline-none focus:border-primary"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="ARB">ARB</option>
              </select>
            </div>
          </div>

          {/* Wallet Address Display */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Full Wallet Address
              </span>
              <span className="text-[11px] font-mono text-primary font-medium">ENS Ready</span>
            </div>
            <div className="font-mono text-[13px] font-bold text-foreground bg-card-secondary p-3.5 rounded-[16px] border border-border/80 break-all select-all flex items-center justify-between gap-2 shadow-inner">
              <span className="truncate">{address}</span>
            </div>
          </div>

          {/* Copy & Share Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 rounded-[16px] bg-primary py-3.5 text-[13px] font-bold text-white shadow-sm hover:bg-primary/90 transition active:scale-95"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied!" : "Copy Address"}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-[16px] border border-border bg-card-secondary py-3.5 text-[13px] font-bold text-foreground hover:bg-accent/10 transition active:scale-95"
            >
              <Share2 className="h-4 w-4 text-primary" />
              <span>Share Address</span>
            </button>
          </div>
        </div>

        {/* Security Warnings Card */}
        <div className="rounded-[20px] border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-[13px] font-bold text-amber-900 dark:text-amber-200">
            <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Receive Safety Guidelines</span>
          </div>
          <ul className="text-[11.5px] leading-relaxed text-amber-900/90 dark:text-amber-200/90 space-y-1 pl-5 list-disc">
            <li>Only send assets supported on the <span className="font-bold">{selectedNetwork.name}</span> network.</li>
            <li>Sending unsupported tokens or wrong network assets may result in permanent loss of funds.</li>
            <li>Never share your recovery phrase or private key with anyone.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
