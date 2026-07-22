export type NotificationCategory = "transaction" | "security" | "price" | "gas" | "system";

import { safeStringify } from "@/lib/supabaseClient";

export interface WalletNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  meta?: Record<string, any>;
}

const STORAGE_KEY = "goflazz_notifications_v1";

const INITIAL_NOTIFICATIONS: WalletNotification[] = [
  {
    id: "notif-1",
    category: "transaction",
    title: "Received 0.42 ETH",
    message: "Transaction confirmed on Ethereum Mainnet from 0x8f2a...19bC",
    timestamp: "10 minutes ago",
    read: false,
    link: "/activity",
  },
  {
    id: "notif-2",
    category: "security",
    title: "Biometric Unlock Activated",
    message: "Biometric authentication was successfully enabled for GoFlazz Wallet.",
    timestamp: "1 hour ago",
    read: false,
    link: "/settings",
  },
  {
    id: "notif-3",
    category: "gas",
    title: "Gas Alert: Low Gwei Detected",
    message: "Ethereum gas drops to 12 Gwei! Ideal time for swaps and NFT minting.",
    timestamp: "3 hours ago",
    read: true,
    link: "/gas",
  },
  {
    id: "notif-4",
    category: "price",
    title: "ETH Target Hit ($3,350)",
    message: "Ethereum surged +2.4% in the last 24 hours.",
    timestamp: "Yesterday",
    read: true,
    link: "/watchlist",
  },
];

export class NotificationsService {
  static getNotifications(): WalletNotification[] {
    if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, safeStringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  static saveNotifications(notifications: WalletNotification[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, safeStringify(notifications));
    } catch (e) {
      console.warn("Failed to save notifications", e);
    }
  }

  static getUnreadCount(): number {
    return NotificationsService.getNotifications().filter((n) => !n.read).length;
  }

  static markAsRead(id: string): WalletNotification[] {
    const list = NotificationsService.getNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    NotificationsService.saveNotifications(list);
    return list;
  }

  static markAllAsRead(): WalletNotification[] {
    const list = NotificationsService.getNotifications().map((n) => ({ ...n, read: true }));
    NotificationsService.saveNotifications(list);
    return list;
  }

  static addNotification(
    category: NotificationCategory,
    title: string,
    message: string,
    link?: string
  ): WalletNotification {
    const list = NotificationsService.getNotifications();
    const newNotif: WalletNotification = {
      id: `notif-${Date.now()}`,
      category,
      title,
      message,
      timestamp: "Just now",
      read: false,
      link,
    };
    const updated = [newNotif, ...list];
    NotificationsService.saveNotifications(updated);

    // Request native browser push notification if permitted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body: message, icon: "/favicon.ico" });
      } catch (err) {
        console.warn("Native notification trigger failed", err);
      }
    }

    return newNotif;
  }

  static clearAll(): WalletNotification[] {
    NotificationsService.saveNotifications([]);
    return [];
  }

  static async requestPushPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }
}
