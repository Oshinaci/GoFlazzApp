import { ArrowDownLeft, ArrowUpRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityType } from "@/types";

const TYPE_ICON: Record<ActivityType, typeof ArrowDownLeft> = {
  receive: ArrowDownLeft,
  send: ArrowUpRight,
  pay: ShoppingBag,
};

const STATUS_CLASSES: Record<ActivityItem["status"], string> = {
  completed: "text-muted-foreground",
  pending: "text-warning",
  failed: "text-danger",
};

export default function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = TYPE_ICON[item.type];
  const isPositive: boolean = item.type === "receive";

  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            isPositive ? "bg-success/10 text-success" : "bg-foreground/5 text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-xs text-muted-foreground">{item.counterparty}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-medium", isPositive ? "text-success" : "")}>
          {isPositive ? "+" : "-"}
          {item.amount} {item.symbol}
        </p>
        <p className={cn("text-xs capitalize", STATUS_CLASSES[item.status])}>
          {item.status === "completed" ? item.date : item.status}
        </p>
      </div>
    </div>
  );
}
