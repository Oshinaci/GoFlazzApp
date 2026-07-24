import { PerpetualMarketService } from "@/services/trade/perpetualMarket.service";
import { PerpetualPositionService } from "@/services/trade/perpetualPosition.service";
import { PerpetualPerformanceService } from "@/services/trade/perpetualPerformance.service";

describe("Perpetual Trading Engine Tests", () => {
  test("PerpetualMarketService loads markets correctly", () => {
    const markets = PerpetualMarketService.getMarkets();
    expect(markets.length).toBeGreaterThan(0);
    const btcPerp = PerpetualMarketService.getMarket("BTC-PERP");
    expect(btcPerp).toBeDefined();
    expect(btcPerp?.symbol).toBe("BTC-PERP");
    expect(btcPerp?.maxLeverage).toBe(100);
  });

  test("PerpetualMarketService searches markets correctly", () => {
    const results = PerpetualMarketService.searchMarkets("ETH");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].symbol).toContain("ETH");
  });

  test("PerpetualPositionService computes account summary correctly", () => {
    const summary = PerpetualPositionService.getAccountSummary();
    expect(summary.totalBalance).toBeGreaterThan(0);
    expect(summary.availableMargin).toBeGreaterThanOrEqual(0);
    const positions = PerpetualPositionService.getPositions();
    expect(positions.length).toBeGreaterThan(0);
  });

  test("PerpetualPerformanceService returns statistics and leaderboard", () => {
    const stats = PerpetualPerformanceService.getPerformanceStats();
    expect(stats.winRate).toBeGreaterThan(0);
    const leaderboard = PerpetualPerformanceService.getLeaderboard();
    expect(leaderboard.length).toBeGreaterThan(0);
    expect(leaderboard[0].rank).toBe(1);
  });
});
