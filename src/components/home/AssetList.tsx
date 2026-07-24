import { formatCurrency } from "@/lib/utils";
import type { Asset } from "@/types";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface AssetListProps {
  assets: Asset[];
  loading: boolean;
  showHiddenAssets: boolean;
  setShowHiddenAssets: (show: boolean) => void;
}

export default function AssetList({ assets, loading, showHiddenAssets, setShowHiddenAssets }: AssetListProps) {
  return (
    <section className="space-y-2">
      <div className="px-1 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Assets</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHiddenAssets(!showHiddenAssets)}
            className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
          >
            {showHiddenAssets ? (
              <>
                <EyeOff className="h-3 w-3" /> Hide zero balance
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" /> Show all
              </>
            )}
          </button>
          <span className="text-[11px] font-medium text-muted-foreground">
            • {loading ? "..." : assets.length} tokens
          </span>
        </div>
      </div>
      <div className="rounded-[20px] bg-card border border-border/80 divide-y divide-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
              <span className="text-xl">💰</span>
            </div>
            <p className="text-[15px] font-bold text-foreground">No assets found</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Add funds to get started
            </p>
          </div>
        ) : (
          assets.map((asset: Asset) => (
            <div
              key={asset.id}
              className={`flex items-center justify-between p-3.5 hover:bg-foreground/5 transition cursor-pointer group ${asset.balance === 0 ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-xs font-bold border border-border/40"
                  style={{ backgroundColor: `${asset.color}15`, color: asset.color }}
                >
                  {asset.symbol.slice(0, 3)}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-foreground tracking-tight">{asset.name}</p>
                  <p className="text-[13px] font-medium text-muted-foreground">
                    {asset.balance.toLocaleString()} {asset.symbol}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-bold text-foreground tracking-tight">{formatCurrency(asset.valueUsd)}</p>
                <p
                  className={`text-[12px] font-semibold ${
                    asset.changePercent24h > 0
                      ? "text-emerald-500"
                      : asset.changePercent24h < 0
                        ? "text-rose-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {asset.changePercent24h > 0 ? "+" : ""}
                  {asset.changePercent24h.toFixed(1)}%
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
