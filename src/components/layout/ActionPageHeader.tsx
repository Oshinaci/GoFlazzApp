import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ActionPageHeader({
  title,
  backHref = "/",
  onBack,
}: {
  title: string;
  backHref?: string;
  onBack?: () => void;
}) {
  if (onBack) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          type="button"
          aria-label="Back"
          className="rounded-full p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">{title}</h1>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={backHref}
        aria-label="Back"
        className="rounded-full p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-[20px] font-bold tracking-tight text-foreground">{title}</h1>
    </div>
  );
}
