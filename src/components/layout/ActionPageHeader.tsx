import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ActionPageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        href="/"
        aria-label="Back to home"
        className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-xl font-semibold">{title}</h1>
    </div>
  );
}
