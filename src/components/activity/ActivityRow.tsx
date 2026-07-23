"use client";

import { ArrowDownLeft, ArrowUpRight, ShoppingBag, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityType } from "@/types";
import { motion } from "framer-motion";

const TYPE_CONFIG: Record<ActivityType, { icon: typeof ArrowDownLeft; label: string }> = {
  receive: { icon: ArrowDownLeft, label: "Received" },
  send: { icon: ArrowUpRight, label: "Sent" },
  pay: { icon: ShoppingBag, label: "Payment" },
};

const STATUS_CONFIG: Record<ActivityItem["status"], { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  completed: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  pending: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock },
  failed: { color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", icon: AlertTriangle },
};

export default function ActivityRow({ item }: { item: ActivityItem }) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;
  const isPositive = item.type === "receive";
  const statusConfig = STATUS_CONFIG[item.status];

  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between p-4 rounded-[20px] bg-card border border-border/80 shadow-sm hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border transition-colors",
            isPositive
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-card-secondary border-border text-foreground/80 group-hover:border-primary/40"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[15px] font-semibold text-foreground tracking-tight line-clamp-1">{item.label}</p>
          <p className="text-[13px] font-medium text-muted-foreground line-clamp-1">{item.counterparty}</p>
        </div>
      </div>

      <div className="text-right space-y-1 shrink-0">
        <p className={cn("text-[15px] font-bold tracking-tight", isPositive ? "text-emerald-500" : "text-foreground")}>
          {isPositive ? "+" : "-"}{item.amount} {item.symbol}
        </p>
        <div className="flex items-center justify-end gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
              statusConfig.bg,
              statusConfig.color
            )}
          >
            {item.status === "completed" ? item.date : item.status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
