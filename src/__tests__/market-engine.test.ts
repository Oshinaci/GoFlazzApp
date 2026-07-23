/**
 * GoFlazz Market Engine Test Suite
 * Tests Market Overview, Token Directory, Live Price Engine, Price Alerts, Chart Engine, Logo Engine, and Caching.
 */
import { MarketOverviewService } from "@/services/market-overview.service";
import { TokenDirectoryService } from "@/services/token-directory.service";
import { LivePriceEngineService } from "@/services/live-price-engine.service";
import { PriceAlertEngineService } from "@/services/price-alert-engine.service";
import { TokenLogoEngine } from "@/services/token-logo.service";
import { ChartEngineService } from "@/services/chart-engine.service";
import { MarketCacheEngine } from "@/cache/market-cache";
import { FallbackMarketProvider } from "@/providers/market/fallback-market-provider";

describe("GoFlazz Market Engine Suite", () => {
  describe("1. Market Overview", () => {
    it("should fetch valid market overview data", async () => {
      const overview = await MarketOverviewService.getOverview();
      expect(overview).toBeDefined();
      expect(overview.totalMarketCapUsd).toBeGreaterThan(0);
      expect(overview.btcDominancePercentage).toBeGreaterThan(0);
      expect(overview.fearAndGreedIndex.value).toBeGreaterThanOrEqual(0);
      expect(overview.fearAndGreedIndex.value).toBeLessThanOrEqual(100);
      expect(["BULLISH", "BEARISH", "NEUTRAL", "VOLATILE"]).toContain(overview.marketStatus);
    });

    it("should format overview metrics into readable strings", async () => {
      const overview = await MarketOverviewService.getOverview();
      const formatted = MarketOverviewService.formatOverviewStats(overview);
      expect(formatted.totalMarketCap).toContain("$");
      expect(formatted.btcDominance).toContain("%");
    });
  });

  describe("2. Token Directory & Search", () => {
    it("should return search results for keyword 'bitcoin'", async () => {
      const results = await TokenDirectoryService.searchTokens({ keyword: "bitcoin" });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe("BTC");
    });

    it("should filter tokens by category 'layer-1'", async () => {
      const results = await TokenDirectoryService.searchTokens({ category: "layer-1" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((t) => t.category === "layer-1")).toBe(true);
    });

    it("should return market rankings for top gainers", async () => {
      const gainers = await TokenDirectoryService.getRankings("top_gainers", 5);
      expect(gainers.length).toBeGreaterThan(0);
    });
  });

  describe("3. Live Price Engine", () => {
    it("should format prices correctly based on value scale", () => {
      expect(LivePriceEngineService.formatPrice(64200.5)).toBe("$64,200.50");
      expect(LivePriceEngineService.formatPrice(0.8543)).toBe("$0.8543");
    });

    it("should format percentage changes with sign", () => {
      expect(LivePriceEngineService.formatChange(3.45)).toBe("+3.45%");
      expect(LivePriceEngineService.formatChange(-1.25)).toBe("-1.25%");
    });
  });

  describe("4. Price Alert Engine", () => {
    it("should create and evaluate price alert rules", () => {
      const rule = PriceAlertEngineService.createAlert({
        userId: "test_user",
        tokenId: "bitcoin",
        tokenSymbol: "BTC",
        alertType: "ABOVE_PRICE",
        targetValue: 60000,
        currentValueAtCreation: 55000,
        notifyPush: true,
        notifyEmail: false,
        enabled: true,
      });

      expect(rule.id).toBeDefined();

      // Evaluate rule against live stats
      PriceAlertEngineService.evaluateAlerts({
        BTC: {
          priceUsd: 65000,
          priceChange24hPercentage: 5,
          priceChange7dPercentage: 10,
          priceChange30dPercentage: 15,
          marketCapUsd: 1200000000000,
          marketCapRank: 1,
          fullyDilutedValuationUsd: 1200000000000,
          volume24hUsd: 30000000000,
          high24hUsd: 66000,
          low24hUsd: 64000,
          athUsd: 73000,
          athChangePercentage: -10,
          athDate: "",
          atlUsd: 67,
          atlChangePercentage: 90000,
          atlDate: "",
          circulatingSupply: 19000000,
          totalSupply: 19000000,
          maxSupply: 21000000,
          lastUpdated: new Date().toISOString(),
        },
      });

      const alerts = PriceAlertEngineService.getAlerts();
      const updated = alerts.find((a) => a.id === rule.id);
      expect(updated?.triggered).toBe(true);

      // Clean up
      PriceAlertEngineService.deleteAlert(rule.id);
    });
  });

  describe("5. Token Logo Engine", () => {
    it("should return official logo or fallback URL", () => {
      const btcLogo = TokenLogoEngine.getTokenLogoUrl("BTC");
      expect(btcLogo).toContain("bitcoin");

      const unknownLogo = TokenLogoEngine.getTokenLogoUrl("UNKNOWN");
      expect(unknownLogo).toContain("avatar.vercel.sh");
    });
  });

  describe("6. Chart Engine Service", () => {
    it("should format OHLCV points for Lightweight Charts candlestick series", async () => {
      const series = await ChartEngineService.getChartSeries("bitcoin", "1D");
      expect(series.points.length).toBeGreaterThan(0);

      const formatted = ChartEngineService.formatForLightweightCandlestick(series.points);
      expect(formatted[0]).toHaveProperty("time");
      expect(formatted[0]).toHaveProperty("open");
      expect(formatted[0]).toHaveProperty("high");
      expect(formatted[0]).toHaveProperty("low");
      expect(formatted[0]).toHaveProperty("close");
    });
  });

  describe("7. Market Cache Engine", () => {
    it("should set and retrieve values from memory and storage", () => {
      MarketCacheEngine.set("test_key", { value: 123 }, 10000);
      const cached = MarketCacheEngine.get<{ value: number }>("test_key");
      expect(cached).toEqual({ value: 123 });
    });
  });
});
