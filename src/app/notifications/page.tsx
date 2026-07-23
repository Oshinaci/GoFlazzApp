"use client";

import React, { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  Bell,
  CheckCheck,
  Trash2,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  NotificationsService,
  WalletNotification,
  NotificationCategory,
} from "@/services/notifications.service";
import { toast } from "sonner";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<WalletNotification[]>([]);
  const [filter, setFilter] = useState<"all" | NotificationCategory>("all");
  const [hasPushPermission, setHasPushPermission] = useState<boolean>(false);

  useEffect(() => {
    setNotifications(NotificationsService.getNotifications());
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPushPermission(Notification.permission === "granted");
    }
  }, []);

  const handleMarkAllRead = () => {
    const updated = NotificationsService.markAllAsRead();
    setNotifications(updated);
    toast.success("All notifications marked as read.");
  };

  const handleClearAll = () => {
    NotificationsService.clearAll();
    setNotifications([]);
    toast.success("Notifications cleared.");
  };

  const handleRequestPush = async () => {
    const granted = await NotificationsService.requestPushPermission();
    setHasPushPermission(granted);
    if (granted) {
      toast.success("Browser push notifications enabled!");
    } else {
      toast.error("Push notification permission denied in browser settings.");
    }
  };

  const handleReadSingle = (id: string) => {
    const updated = NotificationsService.markAsRead(id);
    setNotifications(updated);
  };

  const filtered = notifications.filter(
    (n) => filter === "all" || n.category === filter
  );

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case "transaction":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
      case "security":
        return <ShieldAlert className="h-4 w-4 text-amber-400" />;
      case "price":
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case "gas":
        return <Zap className="h-4 w-4 text-purple-400" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-28 pt-2">
      <div className="mx-auto max-w-[440px] px-3 sm:px-4 space-y-4">
        <ActionPageHeader title="Notification Center" backHref="/" />
        {/* PUSH PERMISSION BANNER */}
        {!hasPushPermission && (
          <div className="rounded-3xl border border-primary/30 bg-primary/10 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-primary text-sm">
              <Bell className="h-4 w-4" />
              <span>Enable Browser Push Notifications</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Get real-time push alerts for incoming crypto transfers, security events, and price target alerts even when closed.
            </p>
            <button
              onClick={handleRequestPush}
              className="w-full rounded-2xl bg-primary py-2.5 font-bold text-black shadow-md hover:bg-primary/90"
            >
              Enable Push Notifications
            </button>
          </div>
        )}

        {/* HEADER TOOLBAR & FILTER TABS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Read All</span>
              </button>
              <span className="text-muted-foreground/30">•</span>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs text-rose-400 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>
            </div>
            <span className="text-xs text-muted-foreground">{notifications.filter((n) => !n.read).length} Unread</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {(["all", "transaction", "security", "price", "gas"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-2xl border px-3 py-1.5 font-medium transition capitalize whitespace-nowrap ${
                  filter === cat
                    ? "border-primary bg-primary text-black font-bold"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATION ITEMS LIST */}
        <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No notifications found in this category.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleReadSingle(item.id)}
                className={`p-4 transition cursor-pointer ${
                  item.read ? "bg-card hover:bg-foreground/5" : "bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-foreground truncate">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.message}</p>

                    {item.link && (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-2 hover:underline"
                      >
                        <span>View Details</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
