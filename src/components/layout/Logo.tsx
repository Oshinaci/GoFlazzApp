import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export default function Logo({ className, size = "md" }: LogoProps) {
  return (
    <span className={cn("logo-text select-none", SIZE_CLASSES[size], className)}>
      GoFlazz
    </span>
  );
}
