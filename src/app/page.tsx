import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import BalanceCard from "@/components/home/BalanceCard";
import QuickActions from "@/components/home/QuickActions";
import AssetList from "@/components/home/AssetList";
import ActivityRow from "@/components/activity/ActivityRow";
import { mockActivity } from "@/data/mock";
import type { ActivityItem } from "@/types";
import { TrendingUp, ArrowRight } from "lucide-react";

export default function HomePage() {
  const recentActivity: ActivityItem[] = mockActivity.slice(0, 3);

  const topWatchlist = [
    { symbol: "BTC", price: "$64,200", change: "+3.45%", isUp: true },
    { symbol: "ETH", price: "$3,350", change: "+2.18%", isUp: true },
    { symbol: "FLZ", price: "$0.24", change: "+12.5%", isUp: true },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="container mt-4 max-w-md space-y-6">
        <BalanceCard />
        <QuickActions />

        {/* WATCHLIST SNAPSHOT WIDGET */}
        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Watchlist Highlights</span>
            </div>
            <Link href="/trade" className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
              <span>View Markets</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {topWatchlist.map((item, idx) => (
              <Link
                key={idx}
                href="/trade"
                className="rounded-2xl border border-border/60 bg-background/50 p-2.5 transition hover:border-primary/50 text-left"
              >
                <div className="text-xs font-bold text-foreground">{item.symbol}</div>
                <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">{item.price}</div>
                <div className="text-[10px] font-bold text-emerald-400 mt-1">{item.change}</div>
              </Link>
            ))}
          </div>
        </section>

        <AssetList />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Recent Activity</h2>
            <Link href="/activity" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="glass-card divide-y divide-border">
            {recentActivity.map((item: ActivityItem) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
