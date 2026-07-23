/**
 * Chart Engine Service for GoFlazz
 * Formats and generates high-performance OHLCV candlestick, line, and volume series data for Lightweight Charts.
 */
import { marketRepository } from "@/repositories/market.repository";
import { ChartTimeframe, OHLCVPoint, ChartDataSeries } from "@/types/market";

export class ChartEngineService {
  /**
   * Fetch OHLCV history for token
   */
  static async getChartSeries(tokenId: string, timeframe: ChartTimeframe): Promise<ChartDataSeries> {
    const points = await marketRepository.getChartHistory(tokenId, timeframe);
    return {
      symbol: tokenId.toUpperCase(),
      timeframe,
      points,
    };
  }

  /**
   * Format points for TradingView Lightweight Charts Candlestick Series
   */
  static formatForLightweightCandlestick(points: OHLCVPoint[]) {
    return points.map((p) => ({
      time: Math.floor(p.timestamp / 1000) as any, // Unix timestamp in seconds
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));
  }

  /**
   * Format points for TradingView Lightweight Charts Line Series
   */
  static formatForLightweightLine(points: OHLCVPoint[]) {
    return points.map((p) => ({
      time: Math.floor(p.timestamp / 1000) as any,
      value: p.close,
    }));
  }

  /**
   * Format points for TradingView Lightweight Charts Histogram Volume Series
   */
  static formatForLightweightVolume(points: OHLCVPoint[]) {
    return points.map((p) => ({
      time: Math.floor(p.timestamp / 1000) as any,
      value: p.volume,
      color: p.close >= p.open ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
    }));
  }
}
