import { mockAssets } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";
import type { Asset } from "@/types";

export default function AssetList() {
  const assets: Asset[] = mockAssets;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Assets</h2>
        <span className="text-[10px] text-muted-foreground">Simulated data</span>
      </div>
      <div className="glass-card divide-y divide-border">
        {assets.map((asset: Asset) => (
          <div key={asset.id} className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${asset.color}22`, color: asset.color }}
              >
                {asset.symbol.slice(0, 2)}
              </span>
              <div>
                <p className="text-sm font-medium">{asset.name}</p>
                <p className="text-xs text-muted-foreground">
                  {asset.balance} {asset.symbol}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formatCurrency(asset.valueUsd)}</p>
              <p
                className={`text-xs ${
                  asset.changePercent24h > 0
                    ? "text-success"
                    : asset.changePercent24h < 0
                      ? "text-danger"
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
