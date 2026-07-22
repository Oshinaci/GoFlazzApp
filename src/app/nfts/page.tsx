"use client";

import React, { useState } from "react";
import Image from "next/image";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  Image as ImageIcon,
  Send,
  ExternalLink,
  Sparkles,
  Tag,
  ShieldCheck,
  ChevronRight,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { NFTService, NFTItem } from "@/services/nft.service";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function NftGalleryPage() {
  const [nfts, setNfts] = useState<NFTItem[]>(NFTService.getNFTs());
  const [selectedNft, setSelectedNft] = useState<NFTItem | null>(null);

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferSuccessTx, setTransferSuccessTx] = useState<string | null>(null);

  const handleOpenDetails = (nft: NFTItem) => {
    setSelectedNft(nft);
  };

  const handleExecuteTransfer = async () => {
    if (!selectedNft || !recipientAddress.trim()) return;
    if (!recipientAddress.startsWith("0x") || recipientAddress.length < 10) {
      toast.error("Please enter a valid EVM recipient address.");
      return;
    }

    setIsTransferring(true);
    try {
      const res = await NFTService.transferNFT(selectedNft.id, recipientAddress);
      if (res.success && res.txHash) {
        setTransferSuccessTx(res.txHash);
        toast.success(`NFT Transferred: ${selectedNft.name}`);
        setNfts((prev) => prev.filter((item) => item.id !== selectedNft.id));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to transfer NFT.");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <ActionPageHeader title="NFT Gallery" backHref="/" />

      <div className="container mt-4 max-w-md space-y-5 px-4">
        {/* Header Stats Bar */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <span className="text-xs text-muted-foreground">Total Collectibles</span>
            <div className="text-xl font-bold text-foreground mt-0.5">{nfts.length} NFTs</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <span className="text-xs text-muted-foreground">Total Portfolio Floor</span>
            <div className="text-xl font-bold text-primary mt-0.5">
              {nfts.reduce((acc, curr) => acc + curr.floorPriceEth, 0).toFixed(2)} ETH
            </div>
          </div>
        </div>

        {/* NFT GRID GALLERY */}
        <div className="grid grid-cols-2 gap-3.5">
          {nfts.map((nft) => (
            <motion.div
              key={nft.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleOpenDetails(nft)}
              className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-md transition hover:border-primary/50"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
                <Image
                  src={nft.imageUrl}
                  alt={nft.name}
                  fill
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute top-2.5 right-2.5 rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white z-10">
                  {nft.network}
                </span>
              </div>

              <div className="p-3">
                <div className="text-[11px] font-medium text-muted-foreground truncate">
                  {nft.collectionName}
                </div>
                <div className="font-bold text-xs text-foreground truncate">{nft.name}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] border-t border-border/50 pt-1.5">
                  <span className="text-muted-foreground">Floor</span>
                  <span className="font-semibold text-primary">{nft.floorPriceEth} ETH</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* NFT DETAIL DRAWER MODAL */}
      <AnimatePresence>
        {selectedNft && !showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                  {selectedNft.collectionName}
                </span>
                <button
                  onClick={() => setSelectedNft(null)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-zinc-900 mb-4">
                <Image
                  src={selectedNft.imageUrl}
                  alt={selectedNft.name}
                  fill
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>

              <h2 className="text-xl font-bold">{selectedNft.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {selectedNft.description}
              </p>

              {/* Attributes Traits */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Traits & Attributes</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedNft.attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs text-left"
                    >
                      <div className="text-[10px] text-muted-foreground uppercase">{attr.traitType}</div>
                      <div className="font-bold text-foreground truncate">{attr.value}</div>
                      {attr.rarityPercent && (
                        <div className="text-[10px] text-primary mt-0.5">{attr.rarityPercent}% possess this</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2.5">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-bold text-black"
                >
                  <Send className="h-4 w-4" />
                  <span>Transfer NFT</span>
                </button>
                <button
                  onClick={() => toast.info("Marketplace listing feature initialized.")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-xs font-semibold text-foreground hover:bg-foreground/5"
                >
                  <Tag className="h-4 w-4" />
                  <span>List for Sale</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSFER NFT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showTransferModal && selectedNft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl"
            >
              {transferSuccessTx ? (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold">Transfer Complete!</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Transferred {selectedNft.name} to {recipientAddress.slice(0, 6)}...
                    {recipientAddress.slice(-4)}
                  </p>
                  <button
                    onClick={() => {
                      setTransferSuccessTx(null);
                      setShowTransferModal(false);
                      setSelectedNft(null);
                      setRecipientAddress("");
                    }}
                    className="mt-5 w-full rounded-2xl bg-primary py-3 text-xs font-bold text-black"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-base">Transfer {selectedNft.name}</h3>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-muted-foreground">Recipient EVM Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-mono text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="flex-1 rounded-2xl border border-border py-3 text-xs font-semibold text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteTransfer}
                      disabled={isTransferring || !recipientAddress.trim()}
                      className="flex-1 rounded-2xl bg-primary py-3 text-xs font-bold text-black disabled:opacity-50"
                    >
                      {isTransferring ? "Transferring..." : "Confirm Transfer"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
