"use client";

import { useState } from "react";
import Logo from "@/components/layout/Logo";
import ActivityRow from "@/components/activity/ActivityRow";
import { mockActivity } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityType } from "@/types";

type FilterId = "all" | ActivityType;

interface Filter {
  id: FilterId;
  label: string;
}

const FILTERS: Filter[] = [
  { id: "all", label: "All" },
  { id: "send", label: "Sent" },
  { id: "receive", label: "Received" },
  { id: "pay", label: "Payments" },
];

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const activity: ActivityItem[] = mockActivity;

  const filtered: ActivityItem[] =
    activeFilter === "all" ? activity : activity.filter((item: ActivityItem) => item.type === activeFilter);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="container max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
          <Logo size="sm" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter: Filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm transition",
                activeFilter === filter.id ? "bg-blue-gradient" : "glass text-muted-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="glass-card mt-6 divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No activity in this category yet.</p>
          ) : (
            filtered.map((item: ActivityItem) => <ActivityRow key={item.id} item={item} />)
          )}
        </div>
      </div>
    </main>
  );
}
