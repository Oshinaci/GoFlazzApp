"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
  showChineseName?: boolean;
  href?: string | null;
}

const SIZE_CONFIGS = {
  sm: {
    text: "text-lg",
    chinese: "text-xs",
    badge: "h-7 w-7 text-xs rounded-lg",
    gap: "gap-1.5",
  },
  md: {
    text: "text-2xl",
    chinese: "text-sm",
    badge: "h-9 w-9 text-sm rounded-xl",
    gap: "gap-2",
  },
  lg: {
    text: "text-3xl sm:text-4xl",
    chinese: "text-base",
    badge: "h-11 w-11 text-lg rounded-2xl",
    gap: "gap-2.5",
  },
  xl: {
    text: "text-4xl sm:text-5xl",
    chinese: "text-lg",
    badge: "h-14 w-14 text-2xl rounded-2xl",
    gap: "gap-3",
  },
};

export default function Logo({
  className,
  size = "md",
  showIcon = true,
  showChineseName = true,
  href = "/",
}: LogoProps) {
  const config = SIZE_CONFIGS[size];

  const logoContent = (
    <div className={cn("inline-flex items-center select-none group cursor-pointer", config.gap, className)}>
      {showIcon && (
        <div className={cn(
          "relative flex items-center justify-center font-chineseCalligraphy font-black text-amber-300 dark:text-amber-200 bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 dark:from-red-700 dark:via-rose-700 dark:to-amber-500 shadow-md border border-amber-400/40 group-hover:scale-105 transition-transform duration-200 shrink-0",
          config.badge
        )}>
          {/* Traditional Chinese Seal Stamp Calligraphy Symbol '闪' (Flazz) */}
          <span className="relative z-10 leading-none drop-shadow-xs">闪</span>
          {/* Decorative Seal Inner Border */}
          <div className="absolute inset-0.5 border border-amber-300/30 rounded-[inherit] pointer-events-none" />
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className={cn("font-chineseDisplay font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-xs", config.text)}>
          GoFlazz
        </span>
        {showChineseName && (
          <span className={cn("font-chineseCalligraphy font-bold text-amber-500 dark:text-amber-400 tracking-wider ml-0.5 leading-none", config.chinese)}>
            构闪
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block">{logoContent}</Link>;
  }

  return logoContent;
}

