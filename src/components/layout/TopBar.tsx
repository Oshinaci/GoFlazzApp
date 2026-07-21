import { Bell, ScanLine } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function TopBar() {
  return (
    <header className="container flex h-16 items-center justify-between">
      <Logo size="sm" />
      <div className="flex items-center gap-3">
        <button aria-label="Scan" className="rounded-full p-2 hover:bg-white/5">
          <ScanLine className="h-5 w-5" />
        </button>
        <button aria-label="Notifications" className="rounded-full p-2 hover:bg-white/5">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
