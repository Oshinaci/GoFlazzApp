"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, ScanLine, Zap, LogOut, User } from "lucide-react";
import Image from "next/image";
import Logo from "@/components/layout/Logo";
import { NotificationsService } from "@/services/notifications.service";
import { GasService } from "@/services/gas.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function TopBar() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [gasGwei, setGasGwei] = useState<number>(16);
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUnreadCount(NotificationsService.getUnreadCount());
    const info = GasService.getGasInfo("ethereum");
    setGasGwei(info.standardGwei);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Successfully logged out");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to log out");
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <header className="mx-auto max-w-5xl flex h-16 items-center justify-between px-4 sm:px-8">
        <Logo size="sm" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 mr-4">
            <Link href="/" className={`text-sm font-semibold transition hover:text-foreground ${pathname === "/" ? "text-foreground" : "text-muted-foreground"}`}>Home</Link>
            <Link href="/trade" className={`text-sm font-semibold transition hover:text-foreground ${pathname === "/trade" ? "text-foreground" : "text-muted-foreground"}`}>Trade</Link>
            <Link href="/activity" className={`text-sm font-semibold transition hover:text-foreground ${pathname === "/activity" ? "text-foreground" : "text-muted-foreground"}`}>Activity</Link>
            <Link href="/settings" className={`text-sm font-semibold transition hover:text-foreground ${pathname === "/settings" ? "text-foreground" : "text-muted-foreground"}`}>Settings</Link>
          </nav>

          {/* Gas Badge */}
          <Link
            href="/gas"
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
            title="Gas Tracker"
          >
            <Zap className="h-3.5 w-3.5 fill-primary" />
            <span className="hidden sm:inline">{gasGwei} Gwei</span>
            <span className="sm:hidden">{gasGwei}g</span>
          </Link>

          {/* Scan Pay */}
          <Link
            href="/pay"
            aria-label="Scan Pay"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            title="Scan & Pay"
          >
            <ScanLine className="h-5 w-5" />
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative rounded-full p-2 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            aria-label="Log Out"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>

          {/* Profile Photo Icon */}
          <Link
            href="/settings"
            aria-label="Profile Settings"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition hover:border-primary hover:bg-primary/20 hover:scale-105 overflow-hidden ml-0.5"
            title="Profile Settings"
          >
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name || "Profile"}
                width={32}
                height={32}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Link>
        </div>
      </header>
    </div>
  );
}

