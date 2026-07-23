"use client";

import Link from "next/link";
import { Download, ArrowDownUp, RefreshCcw, Image as ImageIcon, Contact2, Search, Zap, BarChart2 } from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: any;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "trade", label: "Trade", href: "/trade", icon: BarChart2 },
  { id: "nfts", label: "NFTs", icon: ImageIcon, href: "/nfts" },
  { id: "address-book", label: "Contacts", href: "/address-book", icon: Contact2 },
  { id: "explorer", label: "Explorer", href: "/explorer", icon: Search },
  { id: "gas", label: "Gas Tracker", href: "/gas", icon: Zap },
];

export default function QuickActions() {
  return (
    <section className="grid grid-cols-5 gap-2">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="rounded-[16px] bg-card border border-border/80 shadow-sm flex flex-col items-center justify-center gap-1.5 py-3 transition hover:border-primary/40 hover:bg-card-secondary text-center group"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <action.icon className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold text-foreground truncate w-full px-1">{action.label}</span>
        </Link>
      ))}
    </section>
  );
}
