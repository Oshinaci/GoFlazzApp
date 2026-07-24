"use client";

import { useState, useMemo, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import { PerpetualMarketService } from "@/services/trade/perpetualMarket.service";
import { PerpetualPositionService } from "@/services/trade/perpetualPosition.service";
import { PerpetualPerformanceService } from "@/services/trade/perpetualPerformance.service";
import { PerpetualMarket, MarginMode, OrderType, PositionSide } from "@/services/trade/perpetual.types";
import { ExecutionEngine } from "@/services/trading/executionEngine";
import { OrderValidator } from "@/services/trading/orderValidator";
import { OrderService } from "@/services/trading/order.service";
import { PositionService } from "@/services/trading/position.service";
import { OrderHistoryService } from "@/services/trading/orderHistory";
import { TradingProviderId, TradingOrderIntent, TradingOrderRecord, PerpetualPositionRecord } from "@/services/trading/trading.types";
import { MarginService, LeverageService, LiquidationService, FundingService, PnLService, RiskCalculator, RiskValidator as RiskEngineValidator } from "@/services";
import {
  TrendingUp,
  TrendingDown,
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
  Star,
  Activity,
  Layers,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Trophy,
  Flame,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

export default function TradeHubPage() {
  const [activeTab, setActiveTab] = useState<"markets" | "trade" | "positions" | "risk" | "dashboard" | "community">("markets");
  const [selectedMarket, setSelectedMarket] = useState<PerpetualMarket>(PerpetualMarketService.getMarkets()[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [favorites, setFavorites] = useState<string[]>(["BTC-PERP", "ETH-PERP", "SOL-PERP"]);

  // Execution Engine & Provider State
  const [selectedProvider, setSelectedProvider] = useState<TradingProviderId>("goflazz_native");
  const [openOrders, setOpenOrders] = useState<TradingOrderRecord[]>([]);
  const [positionsList, setPositionsList] = useState<PerpetualPositionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState(OrderHistoryService.getLogs());

  // Order Entry State
  const [orderSide, setOrderSide] = useState<PositionSide>("long");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [marginMode, setMarginMode] = useState<MarginMode>("cross");
  const [leverage, setLeverage] = useState<number>(20);
  const [orderSize, setOrderSize] = useState<string>("");
  const [limitPrice, setLimitPrice] = useState<string>(selectedMarket.markPrice.toString());
  const [triggerPrice, setTriggerPrice] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [reduceOnly, setReduceOnly] = useState<boolean>(false);
  const [postOnly, setPostOnly] = useState<boolean>(false);

  // Data fetching from services
  const markets = useMemo(() => PerpetualMarketService.searchMarkets(searchQuery, selectedCategory), [searchQuery, selectedCategory]);
  const accountSummary = PerpetualPositionService.getAccountSummary();
  const performanceStats = PerpetualPerformanceService.getPerformanceStats();
  const leaderboard = PerpetualPerformanceService.getLeaderboard();

  // GoFlazz Risk & Margin Engine Calculations
  const riskMarginSummary = useMemo(() => {
    const posDetails = positionsList.map((p) => {
      const notional = p.size * p.markPrice;
      const liq = LiquidationService.calculateLiquidation(
        p.marketSymbol,
        p.side,
        p.entryPrice,
        p.markPrice,
        p.leverage,
        p.size,
        p.margin,
        0.005
      );
      return {
        marketSymbol: p.marketSymbol,
        leverage: p.leverage,
        notional,
        notionalValue: notional,
        liquidationDistancePct: liq.distancePercentage,
        initialMarginRate: 1 / p.leverage,
        maintenanceMarginRate: 0.005,
      };
    });

    const summary = MarginService.calculateMarginSummary(
      accountSummary.totalBalance - accountSummary.unrealizedPnl,
      accountSummary.unrealizedPnl,
      posDetails
    );

    const assessment = RiskCalculator.assessPortfolioRisk(
      summary.totalEquity,
      summary.usedMargin,
      posDetails
    );

    return {
      summary,
      assessment,
      positionsLiquidation: posDetails,
    };
  }, [positionsList, accountSummary]);

  // Load live open orders and positions from provider adapter on mount or provider change
  useEffect(() => {
    async function loadEngineData() {
      try {
        const orders = await OrderService.getOpenOrders(selectedProvider);
        const positions = await PositionService.getPositions(selectedProvider);
        setOpenOrders(orders);
        setPositionsList(positions.length > 0 ? positions : PerpetualPositionService.getPositions() as any);
        setAuditLogs([...OrderHistoryService.getLogs()]);
      } catch (err) {
        console.error("Failed to load trading engine data:", err);
      }
    }
    loadEngineData();
  }, [selectedProvider]);

  // Real-time preview calculation
  const previewResult = useMemo(() => {
    const sizeNum = Number(orderSize) || 0;
    const priceNum = orderType === "market" ? selectedMarket.markPrice : Number(limitPrice) || selectedMarket.markPrice;
    const intent: TradingOrderIntent = {
      marketSymbol: selectedMarket.symbol,
      side: orderSide,
      orderType,
      marginMode,
      leverage,
      size: sizeNum,
      price: priceNum,
      reduceOnly,
      postOnly,
    };

    return OrderValidator.validate(intent, {
      isWalletConnected: true,
      isTradingAccountReady: true,
      availableMargin: accountSummary.availableMargin,
      maxLeverage: selectedMarket.maxLeverage,
      currentPositionsCount: positionsList.length,
      maxPositionsAllowed: 10,
      markPrice: selectedMarket.markPrice,
      minOrderSize: 0.001,
      maxOrderSize: 10.0,
      minNotional: 10.0,
      tickSize: 0.1,
      lotSize: 0.0001,
    });
  }, [orderSize, orderType, limitPrice, selectedMarket, orderSide, marginMode, leverage, reduceOnly, postOnly, accountSummary.availableMargin, positionsList.length]);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(symbol)) {
      setFavorites(favorites.filter((s) => s !== symbol));
      toast.info(`Removed ${symbol} from favorites`);
    } else {
      setFavorites([...favorites, symbol]);
      toast.success(`Added ${symbol} to favorites`);
    }
  };

  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const sizeNum = Number(orderSize);
    if (!sizeNum || sizeNum <= 0) {
      toast.error("Please enter a valid order size.");
      return;
    }

    const intent: TradingOrderIntent = {
      marketSymbol: selectedMarket.symbol,
      side: orderSide,
      orderType,
      marginMode,
      leverage,
      size: sizeNum,
      price: orderType === "market" ? selectedMarket.markPrice : Number(limitPrice),
      triggerPrice: orderType.includes("stop") ? Number(triggerPrice) : undefined,
      reduceOnly,
      postOnly,
      takeProfit: takeProfit ? Number(takeProfit) : undefined,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
    };

    const result = await ExecutionEngine.executeOrder(intent, {
      isWalletConnected: true,
      isTradingAccountReady: true,
      availableMargin: accountSummary.availableMargin,
      maxLeverage: selectedMarket.maxLeverage,
      currentPositionsCount: positionsList.length,
      maxPositionsAllowed: 10,
      markPrice: selectedMarket.markPrice,
      minOrderSize: 0.001,
      maxOrderSize: 10.0,
      minNotional: 10.0,
      tickSize: 0.1,
      lotSize: 0.0001,
    }, selectedProvider);

    if (result.success && result.order) {
      toast.success(`Order successfully executed via [${selectedProvider.toUpperCase()}]! Status: ${result.order.status}`);
      setOrderSize("");
      // Refresh state
      const updatedOrders = await OrderService.getOpenOrders(selectedProvider);
      const updatedPositions = await PositionService.getPositions(selectedProvider);
      setOpenOrders(updatedOrders);
      setPositionsList(updatedPositions);
      setAuditLogs([...OrderHistoryService.getLogs()]);
    } else {
      toast.error(result.error || "Order execution failed.");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const success = await OrderService.cancelOrder(orderId, selectedProvider);
    if (success) {
      toast.success(`Cancelled order ${orderId}`);
      const updatedOrders = await OrderService.getOpenOrders(selectedProvider);
      setOpenOrders(updatedOrders);
      setAuditLogs([...OrderHistoryService.getLogs()]);
    } else {
      toast.error("Failed to cancel order.");
    }
  };

  return (
    <main className="min-h-screen bg-background pb-32 pt-4">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-4 space-y-5">
        <ActionPageHeader title="Perpetual Trading Hub" backHref="/" />

        {/* Account Summary Banner */}
        <div className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>Total Trading Balance (Margin Account)</span>
              </div>
              <div className="text-[28px] sm:text-[32px] font-black text-foreground tracking-tight">
                ${accountSummary.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card-secondary p-3.5 rounded-[18px] border border-border/60">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Unrealized PnL</div>
                <div className={`text-[14px] font-bold ${accountSummary.unrealizedPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {accountSummary.unrealizedPnl >= 0 ? "+" : ""}${accountSummary.unrealizedPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Today&apos;s PnL</div>
                <div className="text-[14px] font-bold text-emerald-500">
                  +${accountSummary.todayPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({accountSummary.todayPnlPercent}%)
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Available Margin</div>
                <div className="text-[14px] font-bold text-foreground">
                  ${accountSummary.availableMargin.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Margin Usage</div>
                <div className="text-[14px] font-bold text-primary">
                  {(accountSummary.marginUsageRatio * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-border/60">
            {[
              { id: "markets", label: "Markets", icon: BarChart2 },
              { id: "trade", label: "Terminal", icon: SlidersHorizontal },
              { id: "positions", label: `Positions (${positionsList.length})`, icon: Layers },
              { id: "risk", label: "Risk & Margin", icon: ShieldCheck },
              { id: "dashboard", label: "Performance", icon: PieChart },
              { id: "community", label: "Community & Rewards", icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-bold transition whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-card-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: MARKETS LIST */}
        {activeTab === "markets" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-[20px] border border-border/80">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search BTC, ETH, SOL, ARB..."
                  className="w-full rounded-[14px] border border-border/80 bg-card-secondary pl-10 pr-3 py-2.5 text-[13px] font-medium text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {["all", "crypto", "layer1", "defi", "meme", "trending"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-[12px] text-[12px] font-bold capitalize transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-card-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {markets.map((m) => {
                const isFav = favorites.includes(m.symbol);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMarket(m);
                      setActiveTab("trade");
                    }}
                    className="rounded-[20px] border border-border/80 bg-card p-4 shadow-sm hover:border-primary/50 transition cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[14px]">
                          {m.baseAsset.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-foreground group-hover:text-primary transition">
                            {m.symbol}
                          </div>
                          <div className="text-[11px] text-muted-foreground">Max {m.maxLeverage}x • Perpetual</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(m.symbol, e)}
                        className={`p-2 rounded-full hover:bg-card-secondary transition ${
                          isFav ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${isFav ? "fill-amber-500" : ""}`} />
                      </button>
                    </div>

                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <div className="text-[11px] text-muted-foreground">Mark Price</div>
                        <div className="text-[16px] font-bold text-foreground font-mono">
                          ${m.markPrice.toLocaleString("en-US", { minimumFractionDigits: m.markPrice < 1 ? 4 : 2 })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground">24h Change</div>
                        <div className={`text-[13px] font-bold flex items-center justify-end gap-0.5 ${m.change24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {m.change24h >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          <span>{m.change24h >= 0 ? "+" : ""}{m.change24h}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Vol: {m.volume24h}</span>
                      <span>OI: {m.openInterest}</span>
                      <span className="text-primary font-semibold">Trade →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: TRADING TERMINAL */}
        {activeTab === "trade" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
            {/* Left 2 Cols: Chart & Market Stats */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {selectedMarket.baseAsset.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[16px] font-bold text-foreground">{selectedMarket.symbol}</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                          {selectedMarket.maxLeverage}x Perpetual
                        </span>
                      </div>
                      <div className="text-[12px] font-mono font-bold text-foreground">
                        ${selectedMarket.markPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[12px]">
                    <div>
                      <div className="text-muted-foreground">24h High</div>
                      <div className="font-bold font-mono text-foreground">${selectedMarket.high24h.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">24h Low</div>
                      <div className="font-bold font-mono text-foreground">${selectedMarket.low24h.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Funding / Countdown</div>
                      <div className="font-bold font-mono text-emerald-500">
                        {(selectedMarket.fundingRate * 100).toFixed(4)}% (04h 20m)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Chart Container */}
                <div className="h-72 w-full bg-card-secondary rounded-[18px] border border-border/60 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between px-2 text-[11px] text-muted-foreground font-semibold">
                    <span>TradingView Simulation • 1H Candles</span>
                    <span className="text-emerald-500 font-mono">Index: ${selectedMarket.indexPrice}</span>
                  </div>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={selectedMarket.sparkline.map((val, idx) => ({ time: idx, price: val }))}
                      >
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={["auto", "auto"]} hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: 12 }}
                          labelStyle={{ color: "#94A3B8" }}
                        />
                        <Area type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Order Form */}
            <div className="space-y-4">
              <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-foreground">Order Entry</h3>
                  <div className="flex rounded-[12px] bg-card-secondary p-1 border border-border">
                    <button
                      type="button"
                      onClick={() => setOrderSide("long")}
                      className={`px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition ${
                        orderSide === "long" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Long (Buy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderSide("short")}
                      className={`px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition ${
                        orderSide === "short" ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Short (Sell)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleExecuteOrder} className="space-y-4">
                  {/* Margin Mode & Leverage Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">Margin Mode</label>
                      <select
                        value={marginMode}
                        onChange={(e) => setMarginMode(e.target.value as MarginMode)}
                        className="w-full rounded-[12px] border border-border bg-card-secondary px-3 py-2 text-[12px] font-bold text-foreground outline-none focus:border-primary"
                      >
                        <option value="cross">Cross</option>
                        <option value="isolated">Isolated</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">Leverage ({leverage}x)</label>
                      <select
                        value={leverage}
                        onChange={(e) => setLeverage(Number(e.target.value))}
                        className="w-full rounded-[12px] border border-border bg-card-secondary px-3 py-2 text-[12px] font-bold text-foreground outline-none focus:border-primary"
                      >
                        {[1, 5, 10, 20, 25, 50, 75, 100].map((lvl) => (
                          <option key={lvl} value={lvl} disabled={lvl > selectedMarket.maxLeverage}>
                            {lvl}x {lvl > selectedMarket.maxLeverage ? "(Max Exceeded)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Order Type Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Order Type</label>
                    <div className="grid grid-cols-4 gap-1 bg-card-secondary p-1 rounded-[14px] border border-border">
                      {(["market", "limit", "stop_market", "stop_limit"] as OrderType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOrderType(type)}
                          className={`py-1.5 rounded-[10px] text-[10px] font-bold uppercase transition ${
                            orderType === type ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {type.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Limit or Trigger Price */}
                  {orderType !== "market" && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">Limit Price (USDT)</label>
                      <input
                        type="number"
                        step="any"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-full rounded-[12px] border border-border bg-card-secondary px-3 py-2 text-[13px] font-mono font-bold text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Size Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Order Size ({selectedMarket.baseAsset})</label>
                    <input
                      type="number"
                      step="any"
                      value={orderSize}
                      onChange={(e) => setOrderSize(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-[12px] border border-border bg-card-secondary px-3 py-2 text-[13px] font-mono font-bold text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {/* TP / SL toggles */}
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted-foreground">Take Profit / Stop Loss</span>
                      <span className="text-primary font-semibold text-[11px]">Optional</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Take Profit"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        className="rounded-[10px] border border-border bg-card-secondary px-3 py-1.5 text-[11px] font-mono text-foreground outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        placeholder="Stop Loss"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="rounded-[10px] border border-border bg-card-secondary px-3 py-1.5 text-[11px] font-mono text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    {/* Preview / Validator Feedback Box */}
                    <div className="rounded-[14px] bg-card-secondary p-3 space-y-2 border border-border/60 text-[11px]">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          <span>Order Preview & Risk Check</span>
                        </span>
                        <span className={`font-bold ${previewResult.isValid ? "text-emerald-500" : "text-red-500"}`}>
                          {previewResult.isValid ? "Ready to Execute" : "Validation Failed"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div>
                          <span className="text-muted-foreground">Margin Required:</span> <span className="font-bold text-foreground">${previewResult.marginRequired.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Liq. Price:</span> <span className="font-bold text-red-500">${previewResult.estimatedLiquidationPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Fee:</span> <span className="font-bold text-foreground">${previewResult.estimatedFee.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risk Score:</span> <span className={`font-bold ${previewResult.riskScore > 75 ? "text-red-500" : "text-emerald-500"}`}>{previewResult.riskScore.toFixed(0)}/100</span>
                        </div>
                      </div>

                      {previewResult.errors.length > 0 && (
                        <div className="p-2 rounded-[8px] bg-red-500/10 text-red-500 font-medium space-y-1">
                          {previewResult.errors.map((err, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {previewResult.warnings.length > 0 && (
                        <div className="p-2 rounded-[8px] bg-amber-500/10 text-amber-500 font-medium space-y-1">
                          {previewResult.warnings.map((warn, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Provider Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Execution Provider Adapter</label>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value as TradingProviderId)}
                        className="w-full rounded-[10px] border border-border bg-card-secondary px-3 py-1.5 text-[11px] font-bold text-foreground outline-none focus:border-primary"
                      >
                        <option value="goflazz_native">GoFlazz Native Perpetual Engine</option>
                        <option value="hyperliquid">Hyperliquid L1 Adapter</option>
                        <option value="vertex">Vertex Protocol Adapter</option>
                        <option value="synfutures">SynFutures V3 Adapter</option>
                        <option value="orderly">Orderly Network Adapter</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!previewResult.isValid}
                      className={`w-full py-3.5 rounded-[16px] text-white text-[14px] font-bold shadow-sm transition ${
                        !previewResult.isValid
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : orderSide === "long"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {orderSide === "long" ? "Execute Long" : "Execute Short"} {selectedMarket.baseAsset} ({leverage}x)
                    </button>
                    <p className="text-[10px] text-center text-muted-foreground pt-1">
                      Real Perpetual Execution Engine active. Secured by EIP-712 & Isolated Decryption.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POSITIONS & ORDERS */}
        {activeTab === "positions" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="space-y-3">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>Active Perpetual Positions ({positionsList.length})</span>
              </h3>

              <div className="space-y-3">
                {positionsList.length === 0 ? (
                  <div className="rounded-[20px] border border-border/80 bg-card p-8 text-center text-muted-foreground text-[13px]">
                    No active positions found. Execute an order from the trading terminal.
                  </div>
                ) : (
                  positionsList.map((pos) => (
                    <div key={pos.id} className="rounded-[20px] border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold uppercase ${pos.side === "long" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                            {pos.side} {pos.leverage}x
                          </span>
                          <span className="text-[15px] font-bold text-foreground">{pos.marketSymbol}</span>
                          <span className="text-[11px] text-muted-foreground uppercase font-semibold">({pos.marginMode})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-muted-foreground">Unrealized PnL (ROE)</div>
                          <div className={`text-[14px] font-bold ${pos.unrealizedPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)} (+{pos.roe.toFixed(1)}%)
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-card-secondary p-3 rounded-[14px] text-[12px]">
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase font-bold">Size</div>
                          <div className="font-mono font-bold text-foreground">{pos.size}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase font-bold">Entry Price</div>
                          <div className="font-mono font-bold text-foreground">${pos.entryPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase font-bold">Mark Price</div>
                          <div className="font-mono font-bold text-foreground">${pos.markPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">Liq. Price</span>
                          <div className="font-mono font-bold text-red-500">${pos.liquidationPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase font-bold">Margin</div>
                          <div className="font-mono font-bold text-foreground">${pos.margin.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Open Orders Section */}
            <div className="space-y-3 pt-4">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Open Limit/Stop Orders ({openOrders.length})</span>
              </h3>

              <div className="space-y-3">
                {openOrders.length === 0 ? (
                  <div className="rounded-[20px] border border-border/80 bg-card p-6 text-center text-muted-foreground text-[13px]">
                    No open orders.
                  </div>
                ) : (
                  openOrders.map((ord) => (
                    <div key={ord.id} className="rounded-[16px] border border-border/80 bg-card p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${ord.side === "long" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                            {ord.side}
                          </span>
                          <span className="text-[14px] font-bold text-foreground">{ord.marketSymbol}</span>
                          <span className="text-[11px] text-muted-foreground uppercase">{ord.orderType}</span>
                        </div>
                        <div className="text-[12px] font-mono text-muted-foreground">
                          Size: {ord.size} @ ${ord.price || ord.triggerPrice || 0} • Provider: {ord.providerId}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        className="px-3 py-1.5 rounded-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[12px] font-bold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audit Log / Execution History */}
            <div className="space-y-3 pt-4">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span>Execution Audit Trail & Logs</span>
              </h3>
              <div className="rounded-[20px] border border-border/80 bg-card p-4 space-y-2 max-h-60 overflow-y-auto font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between border-b border-border/40 pb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">[{log.action}]</span>
                        <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-foreground">{log.details}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-card-secondary text-muted-foreground">{log.marketSymbol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* TAB: RISK & MARGIN ENGINE */}
        {activeTab === "risk" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Risk Overview Banner */}
            <div className="rounded-[22px] border border-border/80 bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[12px] font-bold uppercase text-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>GoFlazz Risk & Margin Engine V2</span>
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground">Real-Time Portfolio Risk & Margin Dashboard</h3>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Portfolio Risk Score</div>
                  <div className={`text-[22px] font-mono font-bold ${riskMarginSummary.assessment.riskScore > 75 ? "text-red-500" : riskMarginSummary.assessment.riskScore > 40 ? "text-amber-500" : "text-emerald-500"}`}>
                    {riskMarginSummary.assessment.riskScore.toFixed(0)}/100
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-card-secondary p-4 rounded-[16px] space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Total Equity</div>
                  <div className="text-[16px] font-mono font-bold text-foreground">${riskMarginSummary.summary.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-card-secondary p-4 rounded-[16px] space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Margin Utilization</div>
                  <div className="text-[16px] font-mono font-bold text-primary">{riskMarginSummary.summary.marginUtilization.toFixed(1)}%</div>
                </div>
                <div className="bg-card-secondary p-4 rounded-[16px] space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Margin Buffer</div>
                  <div className="text-[16px] font-mono font-bold text-emerald-500">${riskMarginSummary.summary.marginBuffer.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-card-secondary p-4 rounded-[16px] space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Buying Power</div>
                  <div className="text-[16px] font-mono font-bold text-foreground">${riskMarginSummary.summary.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>

            {/* Detailed Margin Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-[22px] border border-border/80 bg-card p-5 space-y-4">
                <h4 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Margin Metrics</span>
                </h4>
                <div className="space-y-3 font-mono text-[12px]">
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Initial Margin (IM):</span>
                    <span className="font-bold text-foreground">${riskMarginSummary.summary.initialMargin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Maintenance Margin (MM):</span>
                    <span className="font-bold text-foreground">${riskMarginSummary.summary.maintenanceMargin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Used Margin:</span>
                    <span className="font-bold text-foreground">${riskMarginSummary.summary.usedMargin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Free Margin:</span>
                    <span className="font-bold text-emerald-500">${riskMarginSummary.summary.freeMargin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Margin Ratio (MM / Equity):</span>
                    <span className="font-bold text-foreground">{riskMarginSummary.summary.marginRatio.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-border/80 bg-card p-5 space-y-4">
                <h4 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Active Risk Alerts ({riskMarginSummary.assessment.alerts.length})</span>
                </h4>
                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {riskMarginSummary.assessment.alerts.length === 0 ? (
                    <div className="p-4 rounded-[14px] bg-card-secondary text-center text-muted-foreground text-[12px]">
                      No risk alerts. Portfolio health is stable.
                    </div>
                  ) : (
                    riskMarginSummary.assessment.alerts.map((alert) => (
                      <div key={alert.id} className="p-3 rounded-[14px] bg-red-500/10 border border-red-500/20 text-[11px] space-y-1">
                        <div className="font-bold text-red-500 flex items-center justify-between">
                          <span>{alert.title}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-foreground">{alert.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Position Health & Liquidation Monitor */}
            <div className="rounded-[22px] border border-border/80 bg-card p-5 space-y-4">
              <h4 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span>Position Health & Liquidation Distance Monitor</span>
              </h4>

              <div className="space-y-3">
                {positionsList.length === 0 ? (
                  <div className="p-6 rounded-[16px] bg-card-secondary text-center text-muted-foreground text-[13px]">
                    No open positions to monitor.
                  </div>
                ) : (
                  positionsList.map((pos) => {
                    const liq = LiquidationService.calculateLiquidation(
                      pos.marketSymbol,
                      pos.side,
                      pos.entryPrice,
                      pos.markPrice,
                      pos.leverage,
                      pos.size,
                      pos.margin,
                      0.005
                    );
                    return (
                      <div key={pos.id} className="p-4 rounded-[16px] bg-card-secondary border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold uppercase ${pos.side === "long" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                            {pos.side} {pos.leverage}x
                          </span>
                          <div>
                            <div className="text-[14px] font-bold text-foreground">{pos.marketSymbol}</div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              Entry: ${pos.entryPrice.toLocaleString()} • Mark: ${pos.markPrice.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-right font-mono text-[12px]">
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Liq. Price</div>
                            <div className="font-bold text-red-500">${liq.liquidationPrice.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Distance</div>
                            <div className="font-bold text-foreground">{liq.distancePercentage.toFixed(2)}%</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Health Status</div>
                            <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${LiquidationService.getHealthColor(liq.healthStatus)}`}>
                              {liq.healthStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRADING DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-[20px] border border-border/80 bg-card p-4 space-y-1">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">Daily PnL</div>
                <div className="text-[20px] font-bold text-emerald-500 font-mono">+${performanceStats.dailyPnl.toFixed(2)}</div>
              </div>
              <div className="rounded-[20px] border border-border/80 bg-card p-4 space-y-1">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">Weekly PnL</div>
                <div className="text-[20px] font-bold text-emerald-500 font-mono">+${performanceStats.weeklyPnl.toFixed(2)}</div>
              </div>
              <div className="rounded-[20px] border border-border/80 bg-card p-4 space-y-1">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">Win Rate</div>
                <div className="text-[20px] font-bold text-foreground font-mono">{performanceStats.winRate}%</div>
              </div>
              <div className="rounded-[20px] border border-border/80 bg-card p-4 space-y-1">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">Average Return</div>
                <div className="text-[20px] font-bold text-emerald-500 font-mono">+{performanceStats.averageReturn}%</div>
              </div>
            </div>

            <div className="rounded-[22px] border border-border/80 bg-card p-6 space-y-4">
              <h3 className="text-[15px] font-bold text-foreground">Advanced Trading Performance Analytics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card-secondary p-4 rounded-[16px] space-y-1">
                  <div className="text-[12px] text-muted-foreground">Total Trades Executed</div>
                  <div className="text-[18px] font-bold text-foreground font-mono">{performanceStats.totalTrades} ({performanceStats.profitableTrades} wins)</div>
                </div>
                <div className="bg-card-secondary p-4 rounded-[16px] space-y-1">
                  <div className="text-[12px] text-muted-foreground">Largest Winning Trade</div>
                  <div className="text-[18px] font-bold text-emerald-500 font-mono">+${performanceStats.largestWin.toFixed(2)}</div>
                </div>
                <div className="bg-card-secondary p-4 rounded-[16px] space-y-1">
                  <div className="text-[12px] text-muted-foreground">Largest Losing Trade</div>
                  <div className="text-[18px] font-bold text-red-500 font-mono">${performanceStats.largestLoss.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMMUNITY & REWARDS */}
        {activeTab === "community" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="rounded-[22px] border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-[12px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <span>GoFlazz Season 1 Trading Championship</span>
                </div>
                <h3 className="text-[18px] font-bold text-foreground">Compete for $500,000 in ARB Rewards</h3>
                <p className="text-[12px] text-muted-foreground">
                  Trade perpetual futures on Arbitrum One to climb the global leaderboard and earn season rewards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toast.success("Registered for Season 1 Championship!")}
                className="px-6 py-3 rounded-[16px] bg-primary text-white text-[13px] font-bold shadow-sm hover:bg-primary/90 transition shrink-0"
              >
                Join Championship
              </button>
            </div>

            <div className="rounded-[22px] border border-border/80 bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Global Trading Leaderboard</span>
              </h3>

              <div className="space-y-2.5">
                {leaderboard.map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-3.5 rounded-[16px] bg-card-secondary border border-border/60">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[13px] ${user.rank === 1 ? "bg-amber-500 text-white" : user.rank === 2 ? "bg-slate-300 text-slate-900" : user.rank === 3 ? "bg-amber-700 text-white" : "bg-card text-muted-foreground"}`}>
                        {user.rank}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">{user.avatar}</span>
                        <span className="text-[13px] font-bold text-foreground">{user.username}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">PnL</div>
                        <div className="text-[13px] font-bold text-emerald-500 font-mono">+${user.pnl.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">ROI</div>
                        <div className="text-[13px] font-bold text-primary font-mono">+{user.roi}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
