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
    <main className="min-h-screen bg-background pb-28 pt-2">
      <TopBar />
      <div className="mx-auto max-w-[430px] px-4 space-y-4 mt-3">
        {/* Main Balance Hero */}
        <BalanceCard />

        {/* Quick Actions Grid */}
        <QuickActions />

        {/* Assets List */}
        <AssetList />

        {/* Watchlist Highlights */}
        <section className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Watchlist</span>
            </div>
            <Link href="/market" className="text-[12px] text-primary hover:underline font-semibold flex items-center gap-1">
              <span>Markets</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {topWatchlist.map((item, idx) => (
              <Link
                key={idx}
                href="/market"
                className="rounded-[16px] border border-border/80 bg-card p-3 transition hover:border-primary/40 text-left space-y-1 shadow-sm"
              >
                <div className="text-[13px] font-bold text-foreground">{item.symbol}</div>
                <div className="text-[12px] font-semibold text-muted-foreground">{item.price}</div>
                <div className="text-[11px] font-bold text-emerald-500">{item.change}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
            <Link href="/activity" className="text-[12px] text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentActivity.map((item: ActivityItem) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
