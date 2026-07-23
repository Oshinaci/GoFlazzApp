"use client";

import React, { useState, useEffect, useMemo } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  TrendingUp,
  ArrowDownUp,
  BarChart2,
  SlidersHorizontal,
  Zap,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Search,
  DollarSign,
  Info,
  Settings2,
} from "lucide-react";
import {
  SwapService,
  SUPPORTED_SWAP_TOKENS,
  TokenItem,
  DexRoute,
  SwapQuoteRequest,
  SwapExecutionResult,
} from "@/services/swap.service";
import { CryptoLogo } from "@/components/ui/CryptoLogo";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart,
  Bar,
  Cell
} from "recharts";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TradingPair {
  symbol: string;
  baseToken: string;
  quoteToken: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  chartData: number[];
}

const TRADING_PAIRS: TradingPair[] = [
  {
    symbol: "BTC/USDT",
    baseToken: "BTC",
    quoteToken: "USDT",
    price: 67200.50,
    change24h: +1.85,
    high24h: 68100.00,
    low24h: 65900.00,
    volume24h: "$4.8B",
    chartData: [66000, 66300, 65900, 66800, 67100, 66900, 67400, 67100, 67500, 67200.5],
  },
  {
    symbol: "BTC/ETH",
    baseToken: "BTC",
    quoteToken: "ETH",
    price: 19.47,
    change24h: -1.20,
    high24h: 20.10,
    low24h: 19.10,
    volume24h: "14.2K ETH",
    chartData: [19.8, 19.6, 19.9, 19.5, 19.3, 19.6, 19.47],
  },
  {
    symbol: "BTC/USDC",
    baseToken: "BTC",
    quoteToken: "USDC",
    price: 67195.00,
    change24h: +1.82,
    high24h: 68080.00,
    low24h: 65890.00,
    volume24h: "$1.4B",
    chartData: [66000, 66300, 65900, 66800, 67100, 67195],
  },
  {
    symbol: "ETH/USDT",
    baseToken: "ETH",
    quoteToken: "USDT",
    price: 3450.80,
    change24h: +3.42,
    high24h: 3520.00,
    low24h: 3320.50,
    volume24h: "$1.2B",
    chartData: [3340, 3320, 3380, 3410, 3390, 3430, 3415, 3460, 3440, 3480, 3450.8],
  },
  {
    symbol: "ETH/BTC",
    baseToken: "ETH",
    quoteToken: "BTC",
    price: 0.0513,
    change24h: +1.54,
    high24h: 0.0525,
    low24h: 0.0501,
    volume24h: "8.5K BTC",
    chartData: [0.0505, 0.0508, 0.0510, 0.0513],
  },
  {
    symbol: "SOL/USDT",
    baseToken: "SOL",
    quoteToken: "USDT",
    price: 154.20,
    change24h: -0.92,
    high24h: 159.50,
    low24h: 151.00,
    volume24h: "$680M",
    chartData: [158, 157, 159, 156, 154, 155, 153, 152, 155, 154.2],
  },
  {
    symbol: "SOL/BTC",
    baseToken: "SOL",
    quoteToken: "BTC",
    price: 0.00229,
    change24h: -2.71,
    high24h: 0.00241,
    low24h: 0.00225,
    volume24h: "420 BTC",
    chartData: [0.00235, 0.00231, 0.00229],
  },
  {
    symbol: "ARB/USDT",
    baseToken: "ARB",
    quoteToken: "USDT",
    price: 1.18,
    change24h: +5.12,
    high24h: 1.22,
    low24h: 1.10,
    volume24h: "$180M",
    chartData: [1.11, 1.10, 1.12, 1.14, 1.13, 1.16, 1.15, 1.19, 1.17, 1.18],
  },
  {
    symbol: "BNB/USDT",
    baseToken: "BNB",
    quoteToken: "USDT",
    price: 580.40,
    change24h: +0.65,
    high24h: 588.00,
    low24h: 575.10,
    volume24h: "$340M",
    chartData: [576, 578, 582, 580.4],
  },
];

interface OrderItem {
  id: string;
  pair: string;
  side: "buy" | "sell";
  type: "limit" | "market";
  price: number;
  amount: number;
  total: number;
  filled: number;
  status: "open" | "filled" | "cancelled";
  timestamp: string;
}

const CustomCandle = (props: any) => {
  const { x, y, width, height, payload } = props;
  const isUp = payload.close >= payload.open;
  const fill = isUp ? "#10b981" : "#ef4444";
  
  const totalDiff = payload.high - payload.low;
  const pxPerValue = totalDiff === 0 ? 0 : height / totalDiff;
  
  const topBodyDiff = payload.high - Math.max(payload.open, payload.close);
  const bottomBodyDiff = payload.high - Math.min(payload.open, payload.close);
  
  const bodyY = y + topBodyDiff * pxPerValue;
  const bodyHeight = (bottomBodyDiff - topBodyDiff) * pxPerValue;
  const halfWidth = width / 2;
  
  return (
    <g stroke={fill} fill={fill}>
      <line x1={x + halfWidth} y1={y} x2={x + halfWidth} y2={y + height} strokeWidth={1.5} />
      <rect x={x} y={bodyY} width={width} height={Math.max(bodyHeight, 2)} />
    </g>
  );
};

export default function TradePage() {
  const { activeWallet } = useWallet();

  // Navigation mode: 'spot' or 'swap'
  const [tradeMode, setTradeMode] = useState<"spot" | "swap">("spot");

  // Selected trading pair
  const [selectedPair, setSelectedPair] = useState<TradingPair>(TRADING_PAIRS[0]);
  const [showPairSelector, setShowPairSelector] = useState<boolean>(false);
  const [pairSearchQuery, setPairSearchQuery] = useState<string>("");
  const [pairCategoryFilter, setPairCategoryFilter] = useState<string>("ALL");

  // Filtered trading pairs
  const filteredPairs = useMemo(() => {
    return TRADING_PAIRS.filter((p) => {
      const q = pairSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.symbol.toLowerCase().includes(q) ||
        p.baseToken.toLowerCase().includes(q) ||
        p.quoteToken.toLowerCase().includes(q);

      if (pairCategoryFilter === "BTC") return matchesSearch && (p.baseToken === "BTC" || p.quoteToken === "BTC");
      if (pairCategoryFilter === "USDT") return matchesSearch && p.quoteToken === "USDT";
      if (pairCategoryFilter === "ETH") return matchesSearch && (p.baseToken === "ETH" || p.quoteToken === "ETH");
      return matchesSearch;
    });
  }, [pairSearchQuery, pairCategoryFilter]);

  // Chart state
  const [timeframe, setTimeframe] = useState<"1H" | "4H" | "24H" | "1W">("24H");
  const [chartType, setChartType] = useState<"line" | "candle">("line");

  const chartDataRecharts = useMemo(() => {
    let data = selectedPair.chartData;
    
    // Simulate zooming by changing length based on timeframe
    if (timeframe === "1H") data = data.slice(-4);
    else if (timeframe === "4H") data = data.slice(-8);
    else if (timeframe === "24H") data = data.slice(-16);
    // 1W uses full
    
    return data.map((price, i, arr) => {
      const prev = i === 0 ? price : arr[i - 1];
      const open = prev;
      const close = price;
      // Add a slight randomization to wick lengths
      const high = Math.max(open, close) * (1 + (Math.random() * 0.002));
      const low = Math.min(open, close) * (1 - (Math.random() * 0.002));
      return {
        time: `T${i}`,
        price,
        open,
        close,
        high,
        low,
        range: [low, high]
      };
    });
  }, [selectedPair, timeframe]);

  // Order state
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("limit");
  const [limitPrice, setLimitPrice] = useState<string>(selectedPair.price.toString());
  const [orderAmount, setOrderAmount] = useState<string>("0.1");

  // Console active main tab: 'trade' | 'book' | 'orders' | 'history'
  const [consoleTab, setConsoleTab] = useState<"trade" | "book" | "orders" | "history">("trade");
  const [showOrderBook, setShowOrderBook] = useState<boolean>(true);
  const [userOrders, setUserOrders] = useState<OrderItem[]>([
    {
      id: "ord_101",
      pair: "ETH/USDT",
      side: "buy",
      type: "limit",
      price: 3380.00,
      amount: 0.5,
      total: 1690.00,
      filled: 0,
      status: "open",
      timestamp: "10 mins ago",
    },
    {
      id: "ord_100",
      pair: "BTC/USDT",
      side: "buy",
      type: "market",
      price: 66800.00,
      amount: 0.05,
      total: 3340.00,
      filled: 100,
      status: "filled",
      timestamp: "2 hours ago",
    },
  ]);

  // Real-time ticker simulation
  const [currentPrice, setCurrentPrice] = useState<number>(selectedPair.price);

  useEffect(() => {
    setCurrentPrice(selectedPair.price);
    setLimitPrice(selectedPair.price.toString());
  }, [selectedPair]);

  // Simulate subtle price ticks
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * (currentPrice * 0.0015);
      const newP = parseFloat((currentPrice + delta).toFixed(2));
      setCurrentPrice(newP);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentPrice]);

  // Calculate order total
  const priceToUse = orderType === "market" ? currentPrice : parseFloat(limitPrice) || 0;
  const amountNum = parseFloat(orderAmount) || 0;
  const orderTotal = priceToUse * amountNum;

  // Execute spot order
  const handlePlaceOrder = () => {
    if (amountNum <= 0) {
      toast.error("Please enter a valid order amount.");
      return;
    }

    const newOrder: OrderItem = {
      id: "ord_" + Date.now().toString(36),
      pair: selectedPair.symbol,
      side: orderSide,
      type: orderType,
      price: priceToUse,
      amount: amountNum,
      total: parseFloat(orderTotal.toFixed(2)),
      filled: orderType === "market" ? 100 : 0,
      status: orderType === "market" ? "filled" : "open",
      timestamp: "Just now",
    };

    setUserOrders([newOrder, ...userOrders]);

    if (orderType === "market") {
      toast.success(
        `Executed Market ${orderSide.toUpperCase()} ${amountNum} ${selectedPair.baseToken} @ $${priceToUse.toLocaleString()}`
      );
    } else {
      toast.success(
        `Limit ${orderSide.toUpperCase()} Order placed for ${amountNum} ${selectedPair.baseToken} @ $${priceToUse.toLocaleString()}`
      );
    }
  };

  const handleCancelOrder = (id: string) => {
    setUserOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
    );
    toast.info("Order cancelled.");
  };

  // Mock Order Book depth
  const mockAsks = useMemo(() => {
    return [
      { price: (currentPrice * 1.002).toFixed(2), amount: "1.42", total: "4,900" },
      { price: (currentPrice * 1.0015).toFixed(2), amount: "0.85", total: "2,930" },
      { price: (currentPrice * 1.0008).toFixed(2), amount: "2.10", total: "7,245" },
    ];
  }, [currentPrice]);

  const mockBids = useMemo(() => {
    return [
      { price: (currentPrice * 0.9992).toFixed(2), amount: "1.15", total: "3,965" },
      { price: (currentPrice * 0.9985).toFixed(2), amount: "3.40", total: "11,720" },
      { price: (currentPrice * 0.9980).toFixed(2), amount: "0.90", total: "3,100" },
    ];
  }, [currentPrice]);

  // SWAP AGGREGATOR MODE STATES
  const [fromToken, setFromToken] = useState<TokenItem>(SUPPORTED_SWAP_TOKENS[0]); // ETH
  const [toToken, setToToken] = useState<TokenItem>(SUPPORTED_SWAP_TOKENS[2]); // USDC
  const [swapAmountIn, setSwapAmountIn] = useState<string>("0.5");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [routes, setRoutes] = useState<DexRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<DexRoute | null>(null);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<SwapExecutionResult | null>(null);

  useEffect(() => {
    if (tradeMode !== "swap") return;
    const num = parseFloat(swapAmountIn);
    if (!num || num <= 0) {
      setRoutes([]);
      setSelectedRoute(null);
      return;
    }

    setIsQuoting(true);
    const timer = setTimeout(() => {
      const fetchedRoutes = SwapService.getAggregatedQuotes({
        fromToken,
        toToken,
        amountIn: num,
        slippageTolerance: slippage,
      });
      setRoutes(fetchedRoutes);
      setSelectedRoute(fetchedRoutes[0] || null);
      setIsQuoting(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [fromToken, toToken, swapAmountIn, slippage, tradeMode]);

  const handleExecuteSwap = async () => {
    const num = parseFloat(swapAmountIn);
    if (!num || num <= 0 || !selectedRoute) return;

    setIsSwapping(true);
    try {
      const res = await SwapService.executeSwap(
        { fromToken, toToken, amountIn: num, slippageTolerance: slippage },
        selectedRoute
      );
      if (res.success) {
        setSwapResult(res);
        toast.success(`Swapped ${res.amountIn} ${res.fromSymbol} successfully!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Swap failed");
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-28 pt-2 text-foreground relative">
      <div className="mx-auto max-w-[440px] px-3 sm:px-4 space-y-4">
        <ActionPageHeader title="GoFlazz Trade" backHref="/" />
        {/* Trade Mode Switcher */}
        <div className="flex rounded-[16px] border border-border/80 bg-card p-1 shadow-sm">
          <button
            onClick={() => setTradeMode("spot")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-[12px] py-2 text-xs font-semibold transition ${
              tradeMode === "spot"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Spot Trading
          </button>
          <button
            onClick={() => setTradeMode("swap")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-[12px] py-2 text-xs font-semibold transition ${
              tradeMode === "swap"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownUp className="h-4 w-4" />
            DEX Aggregator
          </button>
        </div>

        {/* MODE 1: SPOT TRADING */}
        {tradeMode === "spot" && (
          <div className="space-y-4">
            {/* Pair Selector Header Banner */}
            <div className={`rounded-[20px] bg-card border border-border/80 p-3.5 flex items-center justify-between relative transition-all shadow-sm ${showPairSelector ? "z-[60]" : "z-10"}`}>
              {/* Soft Click-outside backdrop with translucent blur */}
              {showPairSelector && (
                <div
                  className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-200"
                  onClick={() => setShowPairSelector(false)}
                />
              )}

              <button
                onClick={() => setShowPairSelector(!showPairSelector)}
                className={`flex items-center gap-2 transition group relative z-50 px-2 py-1 rounded-xl ${
                  showPairSelector
                    ? "bg-primary/10 border border-primary/40 ring-2 ring-primary/20"
                    : "hover:opacity-80"
                }`}
              >
                <div className="group-hover:scale-105 transition">
                  <CryptoLogo symbol={selectedPair.baseToken} size="md" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <span>{selectedPair.symbol}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showPairSelector ? "rotate-180 text-primary" : ""}`} />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    24h Vol: {selectedPair.volume24h}
                  </div>
                </div>
              </button>

              <div className="text-right relative z-50">
                <div className="font-mono font-bold text-base text-foreground">
                  ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                    selectedPair.change24h >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  <TrendingUp className={`h-3 w-3 ${selectedPair.change24h < 0 ? "rotate-180" : ""}`} />
                  <span>{selectedPair.change24h >= 0 ? "+" : ""}{selectedPair.change24h}%</span>
                </div>
              </div>

              {/* Opaque Adaptive Searchable Pair Selector Dropdown */}
              <AnimatePresence>
                {showPairSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface dark:bg-[#0B0F1A] border border-border/90 shadow-2xl space-y-3 max-h-[400px] flex flex-col rounded-2xl p-3.5 ring-1 ring-border/60 text-foreground opacity-100"
                  >
                    {/* Header Label */}
                    <div className="flex items-center justify-between text-xs font-bold text-foreground border-b border-border/40 pb-1.5">
                      <span>Select Trading Pair</span>
                      <span className="text-[10px] text-muted-foreground font-normal">{filteredPairs.length} Available</span>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search pairs (e.g. BTC, ETH)..."
                        value={pairSearchQuery}
                        onChange={(e) => setPairSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-muted/60 dark:bg-slate-900/80 border border-border/70 rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition"
                      />
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-semibold custom-scrollbar">
                      {(["ALL", "BTC", "USDT", "ETH"] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPairCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                            pairCategoryFilter === cat
                              ? "bg-primary text-white shadow-xs"
                              : "bg-muted/50 dark:bg-slate-800/80 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {cat === "ALL" ? "All Pairs" : `${cat} Pairs`}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable Pairs List */}
                    <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar max-h-[240px]">
                      {filteredPairs.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          No trading pairs found matching &quot;{pairSearchQuery}&quot;
                        </div>
                      ) : (
                        filteredPairs.map((pair) => (
                          <button
                            key={pair.symbol}
                            onClick={() => {
                              setSelectedPair(pair);
                              setShowPairSelector(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                              selectedPair.symbol === pair.symbol
                                ? "bg-primary/15 border border-primary/40 text-primary font-bold shadow-xs"
                                : "hover:bg-muted/60 dark:hover:bg-slate-800/80 border border-transparent hover:border-border/60"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <CryptoLogo symbol={pair.baseToken} size="sm" />
                              <div className="text-left">
                                <div className="font-bold">{pair.symbol}</div>
                                <div className="text-[10px] text-muted-foreground">Vol {pair.volume24h}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold">${pair.price.toLocaleString()}</div>
                              <div
                                className={`text-[10px] font-semibold ${
                                  pair.change24h >= 0 ? "text-success" : "text-danger"
                                }`}
                              >
                                {pair.change24h >= 0 ? "+" : ""}{pair.change24h}%
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price Chart Box */}
            <div className="glass-card sm:rounded-3xl rounded-none border-x-0 sm:border-x p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-border text-[11px]">
                    {(["1H", "4H", "24H", "1W"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                          timeframe === tf ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  {/* Chart Type Toggle */}
                  <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-border text-[11px]">
                    <button
                      onClick={() => setChartType("line")}
                      className={`px-2 py-1 rounded-lg font-semibold transition ${
                        chartType === "line" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Line
                    </button>
                    <button
                      onClick={() => setChartType("candle")}
                      className={`px-2 py-1 rounded-lg font-semibold transition ${
                        chartType === "candle" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Candle
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span>High: <strong className="text-foreground">${selectedPair.high24h}</strong></span>
                  <span className="ml-2">Low: <strong className="text-foreground">${selectedPair.low24h}</strong></span>
                </div>
              </div>

              {/* Price Chart */}
              <div className="h-64 w-full relative pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={chartDataRecharts} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis
                        domain={["auto", "auto"]}
                        orientation="right"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `$${val}`}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#3B82F6" }}
                      />
                    </LineChart>
                  ) : (
                    <ComposedChart data={chartDataRecharts} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis
                        domain={["auto", "auto"]}
                        orientation="right"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `$${val}`}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Bar dataKey="range" shape={<CustomCandle />} />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* UNIFIED TRADING, ORDER BOOK & ORDERS CONSOLE */}
            <div className="glass-card sm:rounded-3xl rounded-none border-x-0 sm:border-x p-3.5 space-y-3 border-border shadow-xl relative z-20">
              {/* Navigation Header & Order Book Toggle */}
              <div className="flex items-center justify-between border-b border-border pb-2 gap-2">
                <div className="flex text-xs font-bold gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                  <button
                    onClick={() => setConsoleTab("trade")}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                      consoleTab === "trade"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span>Place Order</span>
                  </button>

                  <button
                    onClick={() => setConsoleTab("book")}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                      consoleTab === "book"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Order Book</span>
                  </button>

                  <button
                    onClick={() => setConsoleTab("orders")}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                      consoleTab === "orders"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Active ({userOrders.filter((o) => o.status === "open").length})
                    </span>
                  </button>

                  <button
                    onClick={() => setConsoleTab("history")}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                      consoleTab === "history"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>History</span>
                  </button>
                </div>

                {consoleTab === "trade" && (
                  <button
                    onClick={() => setShowOrderBook(!showOrderBook)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition whitespace-nowrap shrink-0"
                    title={showOrderBook ? "Collapse adjacent Order Book" : "Expand adjacent Order Book"}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden sm:inline">{showOrderBook ? "Hide Order Book" : "Show Order Book"}</span>
                    <span className="sm:hidden">{showOrderBook ? "Book Off" : "Book On"}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showOrderBook ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>

              {/* TAB 1: PLACE ORDER (EXECUTION FORM + ADJACENT COLLAPSIBLE ORDER BOOK) */}
              {consoleTab === "trade" && (
                <div className="space-y-3">
                  <div className={`grid grid-cols-1 ${showOrderBook ? "md:grid-cols-12" : ""} gap-4 items-stretch`}>
                    {/* LEFT COLUMN: PLACE ORDER EXECUTION FORM */}
                    <div className={`${showOrderBook ? "md:col-span-7 lg:col-span-7" : "w-full max-w-xl mx-auto"} min-w-0 space-y-3 flex flex-col justify-between`}>
                      {/* Buy / Sell Side Toggle & Limit / Market Order Type */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 flex rounded-xl bg-surface p-1 border border-border">
                          <button
                            onClick={() => setOrderSide("buy")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                              orderSide === "buy" ? "bg-success text-white shadow-xs" : "text-muted-foreground"
                            }`}
                          >
                            BUY
                          </button>
                          <button
                            onClick={() => setOrderSide("sell")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                              orderSide === "sell" ? "bg-danger text-white shadow-xs" : "text-muted-foreground"
                            }`}
                          >
                            SELL
                          </button>
                        </div>

                        <div className="flex gap-1 bg-surface p-1 rounded-xl border border-border text-xs">
                          <button
                            onClick={() => setOrderType("limit")}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                              orderType === "limit" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                            }`}
                          >
                            Limit
                          </button>
                          <button
                            onClick={() => setOrderType("market")}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                              orderType === "market" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                            }`}
                          >
                            Market
                          </button>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-2.5">
                        {orderType === "limit" && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <label className="text-muted-foreground uppercase font-semibold">
                                Price ({selectedPair.quoteToken})
                              </label>
                              <span className="text-muted-foreground">Market: ${currentPrice.toFixed(2)}</span>
                            </div>
                            <input
                              type="number"
                              value={limitPrice}
                              onChange={(e) => setLimitPrice(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-primary transition"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-semibold">
                            Amount ({selectedPair.baseToken})
                          </label>
                          <input
                            type="number"
                            value={orderAmount}
                            onChange={(e) => setOrderAmount(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-primary transition"
                          />
                        </div>

                        {/* Quick Percentage Pills */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => setOrderAmount((pct * 0.01 * 0.5).toFixed(3))}
                              className="py-1 rounded-lg bg-surface border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                          <span className="text-muted-foreground font-medium">Order Total:</span>
                          <span className="font-mono font-bold text-foreground text-sm">
                            ${orderTotal.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Submit Order Button */}
                      <button
                        onClick={handlePlaceOrder}
                        className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition active:scale-95 ${
                          orderSide === "buy" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                        }`}
                      >
                        Place {orderSide.toUpperCase()} {orderType.toUpperCase()} Order
                      </button>
                    </div>

                    {/* RIGHT COLUMN: COLLAPSIBLE ADJACENT ORDER BOOK PANEL */}
                    <AnimatePresence mode="wait">
                      {showOrderBook && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, height: 0 }}
                          animate={{ opacity: 1, scale: 1, height: "auto" }}
                          exit={{ opacity: 0, scale: 0.96, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="md:col-span-5 lg:col-span-5 w-full min-w-0 rounded-2xl border border-border/80 bg-surface dark:bg-surface/80 p-3 space-y-2 text-xs font-mono flex flex-col justify-between shadow-xs overflow-hidden"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                            <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                              <span>Order Book</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider bg-muted/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-border">
                              {selectedPair.symbol}
                            </span>
                          </div>

                          {/* Order Book Column Headers */}
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/40 pb-1">
                            <span>Price ({selectedPair.quoteToken})</span>
                            <span>Amount</span>
                          </div>

                          {/* Asks (Sell Orders) */}
                          <div className="space-y-1">
                            {mockAsks.map((ask, i) => {
                              const amountVal = parseFloat(ask.amount);
                              const maxAmount = 2.5;
                              const depthPct = Math.min(100, Math.max(12, (amountVal / maxAmount) * 100));
                              return (
                                <motion.button
                                  key={`ask-${i}`}
                                  whileHover={{ x: 2 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={() => setLimitPrice(ask.price)}
                                  className="w-full relative overflow-hidden flex justify-between items-center text-danger hover:bg-danger/10 px-1.5 py-1 rounded-md transition text-left group"
                                  title="Click price to autofill limit order"
                                >
                                  {/* Liquidity Depth Bar */}
                                  <div
                                    className="absolute right-0 top-0 bottom-0 bg-danger/10 dark:bg-danger/15 rounded-r-md transition-all duration-300 pointer-events-none"
                                    style={{ width: `${depthPct}%` }}
                                  />
                                  <span className="font-bold relative z-10 group-hover:underline">{ask.price}</span>
                                  <span className="text-muted-foreground text-[11px] relative z-10">{ask.amount}</span>
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* Spread & Current Price Banner */}
                          <div className="py-1 my-0.5 text-center font-bold text-foreground bg-muted/40 dark:bg-slate-900/60 rounded-xl border border-border/80 shadow-2xs flex items-center justify-between px-2 text-[11px]">
                            <span className="text-[9px] text-muted-foreground font-sans uppercase">Price:</span>
                            <span className="text-xs font-bold text-primary">${currentPrice.toFixed(2)}</span>
                            <span className="text-[9px] text-success font-sans font-semibold">0.08% spread</span>
                          </div>

                          {/* Bids (Buy Orders) */}
                          <div className="space-y-1">
                            {mockBids.map((bid, i) => {
                              const amountVal = parseFloat(bid.amount);
                              const maxAmount = 2.5;
                              const depthPct = Math.min(100, Math.max(12, (amountVal / maxAmount) * 100));
                              return (
                                <motion.button
                                  key={`bid-${i}`}
                                  whileHover={{ x: 2 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={() => setLimitPrice(bid.price)}
                                  className="w-full relative overflow-hidden flex justify-between items-center text-success hover:bg-success/10 px-1.5 py-1 rounded-md transition text-left group"
                                  title="Click price to autofill limit order"
                                >
                                  {/* Liquidity Depth Bar */}
                                  <div
                                    className="absolute right-0 top-0 bottom-0 bg-success/10 dark:bg-success/15 rounded-r-md transition-all duration-300 pointer-events-none"
                                    style={{ width: `${depthPct}%` }}
                                  />
                                  <span className="font-bold relative z-10 group-hover:underline">{bid.price}</span>
                                  <span className="text-muted-foreground text-[11px] relative z-10">{bid.amount}</span>
                                </motion.button>
                              );
                            })}
                          </div>

                          <div className="text-[9px] text-muted-foreground text-center pt-1 font-sans italic border-t border-border/40">
                            Click price to autofill
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* TAB 2: FULL ORDER BOOK */}
              {consoleTab === "book" && (
                <div className="space-y-2 p-1 font-mono text-xs">
                  <div className="flex justify-between text-[10px] font-semibold uppercase text-muted-foreground border-b border-border pb-1">
                    <span>Price ({selectedPair.quoteToken})</span>
                    <span>Amount ({selectedPair.baseToken})</span>
                    <span>Total</span>
                  </div>

                  {/* Asks */}
                  <div className="space-y-1">
                    {mockAsks.map((ask, i) => (
                      <div key={i} className="flex justify-between text-danger">
                        <span>{ask.price}</span>
                        <span className="text-muted-foreground">{ask.amount}</span>
                        <span className="text-foreground">{ask.total}</span>
                      </div>
                    ))}
                  </div>

                  {/* Market Spread */}
                  <div className="py-1.5 text-center font-bold text-foreground bg-surface rounded-xl border border-border my-2">
                    Spread: ${(currentPrice * 0.0008).toFixed(2)} | Current: ${currentPrice.toFixed(2)}
                  </div>

                  {/* Bids */}
                  <div className="space-y-1">
                    {mockBids.map((bid, i) => (
                      <div key={i} className="flex justify-between text-success">
                        <span>{bid.price}</span>
                        <span className="text-muted-foreground">{bid.amount}</span>
                        <span className="text-foreground">{bid.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVE ORDERS */}
              {consoleTab === "orders" && (
                <div className="space-y-2">
                  {userOrders.filter((o) => o.status === "open").length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No open orders for {selectedPair.symbol}
                    </div>
                  ) : (
                    userOrders
                      .filter((o) => o.status === "open")
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl border border-border bg-surface flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                                  ord.side === "buy" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                                }`}
                              >
                                {ord.side}
                              </span>
                              <span className="font-bold">{ord.pair}</span>
                              <span className="text-muted-foreground text-[10px]">{ord.type}</span>
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {ord.amount} @ ${ord.price.toLocaleString()} (${ord.total})
                            </div>
                          </div>

                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="px-2.5 py-1 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* TAB 4: ORDER HISTORY */}
              {consoleTab === "history" && (
                <div className="space-y-2">
                  {userOrders.filter((o) => o.status !== "open").length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No order history found
                    </div>
                  ) : (
                    userOrders
                      .filter((o) => o.status !== "open")
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl border border-border bg-surface flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                                  ord.side === "buy" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                                }`}
                              >
                                {ord.side}
                              </span>
                              <span className="font-bold">{ord.pair}</span>
                              <span className="text-muted-foreground text-[10px]">{ord.timestamp}</span>
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {ord.amount} @ ${ord.price.toLocaleString()} (${ord.total})
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-muted-foreground capitalize bg-background px-2 py-1 rounded-md border border-border">
                            {ord.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: DEX AGGREGATOR SWAP */}
        {tradeMode === "swap" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4 animate-pulse fill-primary" />
                <span className="font-semibold">Best Route Aggregator</span>
              </div>
              <span className="text-muted-foreground">0.0% GoFlazz Fee</span>
            </div>

            <div className="glass-card sm:rounded-3xl rounded-none border-x-0 sm:border-x p-4 space-y-4 border-border shadow-xl">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Pay Amount</span>
                <span>Slippage: {slippage}%</span>
              </div>

              {/* Token In */}
              <div className="rounded-2xl border border-border bg-surface p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={swapAmountIn}
                    onChange={(e) => setSwapAmountIn(e.target.value)}
                    className="w-full bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-semibold">
                    <span className="h-4 w-4 rounded-full bg-primary inline-block" />
                    <span>{fromToken.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Token Out Estimate */}
              <div className="rounded-2xl border border-border bg-surface p-3.5 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Receive (Estimated)
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-2xl font-bold text-foreground">
                    {isQuoting ? (
                      <span className="animate-pulse text-muted-foreground text-sm">Quoting routes...</span>
                    ) : selectedRoute ? (
                      selectedRoute.amountOut.toFixed(4)
                    ) : (
                      "0.00"
                    )}
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-semibold">
                    <span className="h-4 w-4 rounded-full bg-accent inline-block" />
                    <span>{toToken.symbol}</span>
                  </div>
                </div>
              </div>

              {/* DEX Routes */}
              {routes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">Aggregated Routes</span>
                  {routes.map((route, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedRoute(route)}
                      className={`p-3 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition ${
                        selectedRoute?.dexName === route.dexName
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <span>{route.dexLogo}</span>
                        <span>{route.dexName}</span>
                      </div>
                      <div className="text-right font-mono font-bold">
                        {route.amountOut.toFixed(4)} {toToken.symbol}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleExecuteSwap}
                disabled={isSwapping || isQuoting || !selectedRoute}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {isSwapping ? "Executing Swap..." : "Confirm & Swap Tokens"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
