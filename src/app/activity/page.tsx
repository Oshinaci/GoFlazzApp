"use client";

import { useState } from "react";
import { Search, X, History } from "lucide-react";
import ActivityRow from "@/components/activity/ActivityRow";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
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
    <main className="min-h-screen bg-background pb-28 pt-4">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        {/* Page Header */}
        <ActionPageHeader title="Activity" backHref="/" />

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((filter: Filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "shrink-0 rounded-[14px] px-4 py-2 text-[13px] font-semibold transition-all duration-150 select-none border",
                activeFilter === filter.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Compact Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="activity-search-input"
            type="text"
            placeholder="Search recipient, address, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border/80 rounded-[16px] pl-10 pr-10 py-2.5 text-[13px] text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
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

        {/* Transaction Cards List */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center rounded-[20px] bg-card border border-border/80 space-y-2">
              <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-[13px] font-medium text-muted-foreground">
                {searchQuery ? "No matching transactions found." : "No activity in this category yet."}
              </p>
            </div>
          ) : (
            filtered.map((item: ActivityItem) => <ActivityRow key={item.id} item={item} />)
          )}
        </div>
      </div>
    </main>
  );
}
