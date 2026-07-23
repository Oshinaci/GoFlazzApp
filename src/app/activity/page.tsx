"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const activity: ActivityItem[] = mockActivity;

  const filtered: ActivityItem[] = activity.filter((item: ActivityItem) => {
    // 1. Filter by category
    if (activeFilter !== "all" && item.type !== activeFilter) {
      return false;
    }

    // 2. Filter by search query in real-time
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      const matchCounterparty = item.counterparty.toLowerCase().includes(query);
      const matchAmount = item.amount.toString().includes(query);
      const matchSymbol = item.symbol.toLowerCase().includes(query);
      const matchLabel = item.label.toLowerCase().includes(query);

      return matchCounterparty || matchAmount || matchSymbol || matchLabel;
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-5xl px-0 sm:px-4 md:px-8">
        <div className="mb-6 px-4 sm:px-0 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
          <Logo size="sm" />
        </div>

        <div className="px-4 sm:px-0 flex gap-2 overflow-x-auto pb-1">
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

        {/* Real-time Search Input */}
        <div className="mt-4 px-4 sm:px-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="activity-search-input"
              type="text"
              placeholder="Search by recipient, address, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-2xl pl-10 pr-10 py-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-foreground/5 transition"
                aria-label="Clear search"
                id="activity-search-clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="glass-card sm:rounded-3xl rounded-none border-x-0 sm:border-x mt-6 divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {searchQuery ? "No matching transactions found." : "No activity in this category yet."}
            </p>
          ) : (
            filtered.map((item: ActivityItem) => <ActivityRow key={item.id} item={item} />)
          )}
        </div>
      </div>
    </main>
  );
}
