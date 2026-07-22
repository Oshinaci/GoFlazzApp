import React from "react";

const TOKEN_COLORS: Record<string, string> = {
  BTC: "from-orange-400 to-orange-600",
  ETH: "from-blue-500 to-indigo-600",
  USDT: "from-emerald-400 to-emerald-600",
  USDC: "from-blue-400 to-blue-600",
  SOL: "from-purple-500 to-teal-400",
  ARB: "from-blue-400 to-blue-700",
  BNB: "from-yellow-400 to-yellow-600",
  FLZ: "from-primary to-purple-600",
};

export const CryptoLogo = ({ symbol, size = "md" }: { symbol: string, size?: "sm" | "md" | "lg" }) => {
  const gradient = TOKEN_COLORS[symbol] || "from-slate-400 to-slate-600";
  
  const sizeClasses = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-[11px]",
    lg: "h-10 w-10 text-[14px]",
  };

  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} ${sizeClasses[size]} text-white font-bold shadow-sm shrink-0`}>
      {symbol.slice(0, 3)}
    </div>
  );
};
