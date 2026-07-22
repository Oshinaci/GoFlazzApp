import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ActionPageHeader({ title, backHref = "/" }: { title: string; backHref?: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        href={backHref}
        aria-label="Back"
        className="rounded-full p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-xl font-semibold">{title}</h1>
    </div>
  );
}
