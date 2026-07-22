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

export default function TradePage() {
  const { activeWallet } = useWallet();

  // Navigation mode: 'spot' or 'swap'
  const [tradeMode, setTradeMode] = useState<"spot" | "swap">("spot");

  // Selected trading pair
  const [selectedPair, setSelectedPair] = useState<TradingPair>(TRADING_PAIRS[0]);
  const [showPairSelector, setShowPairSelector] = useState<boolean>(false);

  // Chart state
  const [timeframe, setTimeframe] = useState<"1H" | "4H" | "24H" | "1W">("24H");
  const [chartType, setChartType] = useState<"line" | "candle">("line");

  // Order state
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("limit");
  const [limitPrice, setLimitPrice] = useState<string>(selectedPair.price.toString());
  const [orderAmount, setOrderAmount] = useState<string>("0.1");

  // Orders history state
  const [activeTab, setActiveTab] = useState<"orders" | "history">("orders");
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
    <main className="min-h-screen bg-background pb-24 text-foreground relative">
      <ActionPageHeader title="GoFlazz Trade" backHref="/" />

      <div className="container mt-3 max-w-md space-y-4 px-4">
        {/* Trade Mode Switcher */}
        <div className="flex rounded-2xl border border-border bg-surface p-1 shadow-xs">
          <button
            onClick={() => setTradeMode("spot")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
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
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
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
            <div className="glass-card p-3.5 flex items-center justify-between border-border relative">
              <button
                onClick={() => setShowPairSelector(!showPairSelector)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                  {selectedPair.baseToken}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <span>{selectedPair.symbol}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    24h Vol: {selectedPair.volume24h}
                  </div>
                </div>
              </button>

              <div className="text-right">
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

              {/* Pair Selector Dropdown */}
              {showPairSelector && (
                <div className="absolute top-16 left-0 right-0 z-30 glass-card p-2 border border-border shadow-2xl space-y-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Trading Pair
                  </p>
                  {TRADING_PAIRS.map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => {
                        setSelectedPair(pair);
                        setShowPairSelector(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition ${
                        selectedPair.symbol === pair.symbol
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-foreground/5"
                      }`}
                    >
                      <span className="font-bold">{pair.symbol}</span>
                      <span className="font-mono">${pair.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Price Chart Box */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
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

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span>High: <strong className="text-foreground">${selectedPair.high24h}</strong></span>
                  <span className="ml-2">Low: <strong className="text-foreground">${selectedPair.low24h}</strong></span>
                </div>
              </div>

              {/* SVG Sparkline / Line Chart Representation */}
              <div className="h-36 w-full relative flex items-end pt-4 pb-1">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Chart fill */}
                  <polygon
                    points={`0,50 0,25 10,28 20,20 30,15 40,22 50,18 60,12 70,16 80,8 90,14 100,5 100,50`}
                    fill="url(#chartGradient)"
                  />
                  {/* Chart line */}
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    points="0,25 10,28 20,20 30,15 40,22 50,18 60,12 70,16 80,8 90,14 100,5"
                  />
                </svg>
                {/* Current price marker dot */}
                <div className="absolute top-2 right-0 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                  ${currentPrice.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Order Book Depth & Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ORDER BOOK MINI PANEL */}
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5">
                  <span>Price (USDT)</span>
                  <span>Amount</span>
                </div>

                {/* Asks (Sell Orders) */}
                <div className="space-y-1 font-mono text-xs">
                  {mockAsks.map((ask, i) => (
                    <div key={i} className="flex justify-between items-center text-danger">
                      <span>{ask.price}</span>
                      <span className="text-muted-foreground">{ask.amount}</span>
                    </div>
                  ))}
                </div>

                {/* Spread */}
                <div className="py-1 text-center font-mono font-bold text-xs text-foreground bg-surface rounded-lg border border-border">
                  ${currentPrice.toFixed(2)}
                </div>

                {/* Bids (Buy Orders) */}
                <div className="space-y-1 font-mono text-xs">
                  {mockBids.map((bid, i) => (
                    <div key={i} className="flex justify-between items-center text-success">
                      <span>{bid.price}</span>
                      <span className="text-muted-foreground">{bid.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BUY / SELL ORDER EXECUTION FORM */}
              <div className="glass-card p-3.5 space-y-3">
                {/* Buy vs Sell side tabs */}
                <div className="flex rounded-xl bg-surface p-1 border border-border">
                  <button
                    onClick={() => setOrderSide("buy")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      orderSide === "buy" ? "bg-success text-white" : "text-muted-foreground"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setOrderSide("sell")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      orderSide === "sell" ? "bg-danger text-white" : "text-muted-foreground"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* Limit vs Market selector */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Order Type:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrderType("limit")}
                      className={`px-2 py-0.5 rounded font-semibold transition ${
                        orderType === "limit" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Limit
                    </button>
                    <button
                      onClick={() => setOrderType("market")}
                      className={`px-2 py-0.5 rounded font-semibold transition ${
                        orderType === "market" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Market
                    </button>
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-2">
                  {orderType === "limit" && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Price (USDT)</label>
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
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
                      className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  {/* Percentage buttons */}
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => {
                          setOrderAmount((pct * 0.01 * 2).toFixed(3));
                        }}
                        className="py-1 rounded bg-surface border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground transition"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Order Total:</span>
                    <span className="font-mono font-bold text-foreground">${orderTotal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Order Submit Button */}
                <button
                  onClick={handlePlaceOrder}
                  className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition active:scale-95 ${
                    orderSide === "buy" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                  }`}
                >
                  Place {orderSide.toUpperCase()} {orderType.toUpperCase()} Order
                </button>
              </div>
            </div>

            {/* ORDERS & HISTORY PANEL */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex border-b border-border gap-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  Active Orders ({userOrders.filter((o) => o.status === "open").length})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  Order History
                </button>
              </div>

              <div className="space-y-2">
                {userOrders
                  .filter((o) => (activeTab === "orders" ? o.status === "open" : o.status !== "open"))
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

                      {ord.status === "open" ? (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="px-2.5 py-1 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground capitalize">
                          {ord.status}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
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

            <div className="glass-card p-4 space-y-4 border-border shadow-xl">
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
