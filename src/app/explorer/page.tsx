"use client";

import React, { useState } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { Search, Box as Blocks, ArrowUpRight, CheckCircle2, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import { ExplorerService, ExplorerTx, ExplorerBlock, ExplorerAddressResult } from "@/services/explorer.service";
import { toast } from "sonner";

export default function ExplorerPage() {
  const [query, setQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"blocks" | "result">("blocks");

  const [blocks] = useState<ExplorerBlock[]>(ExplorerService.getRecentBlocks());
  const [searchTxResult, setSearchTxResult] = useState<ExplorerTx | null>(null);
  const [searchAddressResult, setSearchAddressResult] = useState<ExplorerAddressResult | null>(null);
  const [searchBlockResult, setSearchBlockResult] = useState<ExplorerBlock | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const classification = ExplorerService.classifyQuery(query);

    if (classification === "tx") {
      setSearchTxResult(ExplorerService.getTxDetails(query));
      setSearchAddressResult(null);
      setSearchBlockResult(null);
      setActiveTab("result");
      toast.success("Found Transaction details.");
    } else if (classification === "address") {
      setSearchAddressResult(ExplorerService.getAddressDetails(query));
      setSearchTxResult(null);
      setSearchBlockResult(null);
      setActiveTab("result");
      toast.success("Found Address balance and activity.");
    } else if (classification === "block") {
      setSearchBlockResult(ExplorerService.getBlockDetails(parseInt(query)));
      setSearchTxResult(null);
      setSearchAddressResult(null);
      setActiveTab("result");
      toast.success("Found Block details.");
    } else {
      toast.error("Unrecognized query format. Enter 0x Tx Hash, 0x Address, or Block number.");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <main className="min-h-screen bg-background pb-28 pt-2">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        <ActionPageHeader title="GoFlazz Explorer" backHref="/" />

        {/* SEARCH BAR */}
        <div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Tx Hash, Address, or Block..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-[16px] border border-border/80 bg-card py-2.5 pl-10 pr-20 text-xs text-foreground outline-none focus:border-primary shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[12px] bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
            >
              Search
            </button>
          </form>
        </div>

        {/* TABS */}
        <div>
          <div className="flex rounded-[16px] border border-border/80 bg-card p-1 text-xs font-medium shadow-sm">
            <button
              onClick={() => setActiveTab("blocks")}
              className={`flex-1 rounded-[12px] py-2 transition ${
                activeTab === "blocks" ? "bg-primary text-white font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Latest Blocks
            </button>
            <button
              onClick={() => setActiveTab("result")}
              disabled={!searchTxResult && !searchAddressResult && !searchBlockResult}
              className={`flex-1 rounded-[12px] py-2 transition ${
                activeTab === "result" ? "bg-primary text-white font-bold shadow-sm" : "text-muted-foreground opacity-50"
              }`}
            >
              Search Result
            </button>
          </div>
        </div>

        {/* RECENT BLOCKS FEED */}
        {activeTab === "blocks" && (
          <div className="space-y-2">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Blocks</h3>
            <div className="rounded-[20px] border border-border/80 bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
              {blocks.map((block) => (
                <div key={block.blockNumber} className="p-3.5 text-xs flex items-center justify-between hover:bg-foreground/5 transition">
                  <div>
                    <div className="font-bold text-primary flex items-center gap-1.5">
                      <span>Block #{block.blockNumber}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {block.txCount} txns • Fee: {block.rewardEth} ETH
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground">{block.timestamp}</span>
                    <div className="text-[11px] font-mono text-muted-foreground truncate w-24">
                      {block.miner}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH RESULT VIEW */}
        {activeTab === "result" && (
          <div className="space-y-4">
            {/* TRANSACTION RESULT */}
            {searchTxResult && (
              <div className="rounded-[20px] border border-border/80 bg-card p-4 space-y-3 text-xs shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-bold text-sm text-foreground">Transaction Details</span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-emerald-400 font-bold">
                    {searchTxResult.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Tx Hash</span>
                    <div className="flex items-center justify-between font-mono font-medium text-foreground text-[11px] break-all bg-card-secondary p-2 rounded-xl mt-1 border border-border/60">
                      <span>{searchTxResult.txHash}</span>
                      <Copy
                        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-2"
                        onClick={() => handleCopy(searchTxResult.txHash)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-muted-foreground">From</span>
                      <div className="font-mono text-foreground truncate">{searchTxResult.from}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">To</span>
                      <div className="font-mono text-foreground truncate">{searchTxResult.to}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground">Value</span>
                      <div className="font-bold text-primary text-sm">{searchTxResult.valueEth} ETH</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gas Price</span>
                      <div className="font-semibold text-foreground">{searchTxResult.gasPriceGwei} Gwei</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADDRESS RESULT */}
            {searchAddressResult && (
              <div className="rounded-[20px] border border-border/80 bg-card p-4 space-y-4 shadow-sm">
                <div className="border-b border-border/60 pb-3">
                  <span className="text-xs text-muted-foreground">Address Overview</span>
                  <div className="font-mono font-bold text-xs text-foreground mt-1 break-all">
                    {searchAddressResult.address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-border/80 bg-card-secondary p-3">
                    <span className="text-[10px] text-muted-foreground">ETH Balance</span>
                    <div className="font-bold text-sm text-foreground">{searchAddressResult.balanceEth} ETH</div>
                  </div>
                  <div className="rounded-[14px] border border-border/80 bg-card-secondary p-3">
                    <span className="text-[10px] text-muted-foreground">USD Value</span>
                    <div className="font-bold text-sm text-primary">${searchAddressResult.balanceUsd.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Token Balances</h4>
                  <div className="space-y-1.5">
                    {searchAddressResult.tokens.map((t, idx) => (
                      <div key={idx} className="flex justify-between text-xs p-2.5 rounded-[12px] bg-card-secondary border border-border/60">
                        <span className="font-bold text-foreground">{t.symbol}</span>
                        <span>{t.balance} (${t.valueUsd.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
