import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Wraps a route that's wired into the app but not yet built out feature-wise.
 * Swap the children for real UI as each page is implemented.
 */
export default function PageShell({ title, description, children, className }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className={cn("mx-auto max-w-3xl", className)}>
        <div className="glass-card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </div>
  );
}
