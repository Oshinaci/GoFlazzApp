import Link from "next/link";
import { Send, Download, Wallet } from "lucide-react";
import type { QuickActionId } from "@/types";

interface QuickAction {
  id: QuickActionId;
  label: string;
  href: string;
  icon: typeof Send;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "send", label: "Send", href: "/send", icon: Send },
  { id: "receive", label: "Receive", href: "/receive", icon: Download },
  { id: "pay", label: "Pay", href: "/pay", icon: Wallet },
];

export default function QuickActions() {
  return (
    <section className="grid grid-cols-3 gap-3">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="glass-card flex flex-col items-center gap-2 py-4 transition hover:bg-white/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-gradient">
            <action.icon className="h-5 w-5" />
          </span>
          <span className="text-sm">{action.label}</span>
        </Link>
      ))}
    </section>
  );
}
