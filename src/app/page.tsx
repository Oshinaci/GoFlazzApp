import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import BalanceCard from "@/components/home/BalanceCard";
import QuickActions from "@/components/home/QuickActions";
import AssetList from "@/components/home/AssetList";
import ActivityRow from "@/components/activity/ActivityRow";
import { mockActivity } from "@/data/mock";
import type { ActivityItem } from "@/types";

export default function HomePage() {
  const recentActivity: ActivityItem[] = mockActivity.slice(0, 3);

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <div className="container mt-4 max-w-md space-y-6">
        <BalanceCard />
        <QuickActions />
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
