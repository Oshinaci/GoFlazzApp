import { FundingRecord } from "./risk.types";

export class FundingService {
  private static fundingStore: Record<string, FundingRecord> = {
    "BTC-PERP": {
      marketSymbol: "BTC-PERP",
      fundingRate: 0.00012, // +0.012% per 8h
      nextFundingTime: new Date(Date.now() + 3600 * 3.5 * 1000).toISOString(),
      estimatedPayment: 1.45,
      paymentIntervalHours: 8,
      historicalRates: [
        { timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), rate: 0.0001 },
        { timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(), rate: 0.00015 },
        { timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), rate: 0.00008 },
      ],
    },
    "ETH-PERP": {
      marketSymbol: "ETH-PERP",
      fundingRate: 0.00009, // +0.009% per 8h
      nextFundingTime: new Date(Date.now() + 3600 * 3.5 * 1000).toISOString(),
      estimatedPayment: 0.85,
      paymentIntervalHours: 8,
      historicalRates: [
        { timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), rate: 0.00008 },
        { timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(), rate: 0.00011 },
      ],
    },
    "SOL-PERP": {
      marketSymbol: "SOL-PERP",
      fundingRate: -0.00025, // negative funding (-0.025%)
      nextFundingTime: new Date(Date.now() + 3600 * 3.5 * 1000).toISOString(),
      estimatedPayment: -2.10,
      paymentIntervalHours: 8,
      historicalRates: [
        { timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), rate: -0.0002 },
        { timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(), rate: -0.0003 },
      ],
    },
  };

  static getFundingRecord(marketSymbol: string): FundingRecord {
    return (
      this.fundingStore[marketSymbol] || {
        marketSymbol,
        fundingRate: 0.0001,
        nextFundingTime: new Date(Date.now() + 3600 * 4 * 1000).toISOString(),
        estimatedPayment: 0.50,
        paymentIntervalHours: 8,
        historicalRates: [],
      }
    );
  }

  static calculateEstimatedPayment(positionNotional: number, fundingRate: number, positionSide: "long" | "short"): number {
    // If rate is positive, longs pay shorts. If negative, shorts pay longs.
    const rawPayment = positionNotional * fundingRate;
    return positionSide === "long" ? -rawPayment : rawPayment;
  }
}
