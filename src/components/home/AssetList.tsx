import { mockAssets } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import type { Asset } from "@/types";

export default function AssetList() {
  const assets: Asset[] = mockAssets;

  return (
    <section className="space-y-2">
      <div className="px-1 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Assets</h2>
        <span className="text-[11px] font-medium text-muted-foreground">
          {assets.length} tokens
        </span>
      </div>
      <div className="rounded-[20px] bg-card border border-border/80 divide-y divide-border/60 shadow-sm overflow-hidden">
        {assets.map((asset: Asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between p-3.5 hover:bg-foreground/5 transition cursor-pointer group"
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
                  {asset.balance} {asset.symbol}
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
        ))}
      </div>
    </section>
  );
}
