"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, ListOrdered, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/market", label: "Market", icon: LineChart },
  { href: "/activity", label: "Activity", icon: ListOrdered },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname: string = usePathname();

  const hiddenRoutes = [
    "/welcome",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/unlock",
    "/auth/callback",
  ];

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 px-2 sm:px-3 pointer-events-none">
      <div className="mx-auto max-w-[480px] rounded-[24px] border border-border/80 bg-card/90 p-1.5 shadow-2xl backdrop-blur-xl pointer-events-auto">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive: boolean = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 rounded-[18px] px-4 py-2 text-[12px] font-medium transition-all duration-200 select-none",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-[18px] bg-primary/10 border border-primary/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 z-10 transition-transform duration-200", isActive && "scale-110")} />
                <span className="z-10 leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
