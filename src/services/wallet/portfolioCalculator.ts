import { FetchedBalance } from "./balanceFetcher";
import { PriceService } from "../price.service";

export interface PortfolioAssetItem {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  valueUsd: number;
  change24h: number;
  address: string | null;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalChange24hUsd: number;
  totalChange24hPercentage: number;
  assets: PortfolioAssetItem[];
}

export class PortfolioCalculator {
  static async calculatePortfolio(balances: FetchedBalance[]): Promise<PortfolioSummary> {
    try {
      const coinIds = ['ethereum', 'arbitrum', 'tether', 'usd-coin', 'chainlink', 'wrapped-bitcoin', 'dai'];
      const prices = await PriceService.fetchTokenPrices(coinIds);

      const priceMap: Record<string, { price: number; change24h: number }> = {
        ETH: { price: prices.ethereum?.price || 3250.40, change24h: prices.ethereum?.change24h || 3.42 },
        USDC: { price: prices["usd-coin"]?.price || 1.00, change24h: prices["usd-coin"]?.change24h || 0.01 },
        USDT: { price: prices.tether?.price || 1.00, change24h: prices.tether?.change24h || 0.01 },
        ARB: { price: prices.arbitrum?.price || 0.85, change24h: prices.arbitrum?.change24h || -1.25 },
        WBTC: { price: prices["wrapped-bitcoin"]?.price || 65000.00, change24h: prices["wrapped-bitcoin"]?.change24h || 2.10 },
        LINK: { price: prices.chainlink?.price || 14.50, change24h: prices.chainlink?.change24h || 1.50 },
        DAI: { price: prices.dai?.price || 1.00, change24h: prices.dai?.change24h || 0.00 },
      };

      let totalValueUsd = 0;
      let totalChange24hUsd = 0;

      const assets: PortfolioAssetItem[] = balances.map((b) => {
        const pData = priceMap[b.symbol.toUpperCase()] || { price: 1.00, change24h: 0 };
        const price = pData.price;
        const change24h = pData.change24h;
        const valueUsd = b.balance * price;
        const assetChangeUsd = valueUsd * (change24h / 100);

        totalValueUsd += valueUsd;
        totalChange24hUsd += assetChangeUsd;

        return {
          symbol: b.symbol,
          name: b.name,
          balance: b.balance,
          price,
          valueUsd,
          change24h,
          address: b.address,
        };
      });

      assets.sort((a, b) => b.valueUsd - a.valueUsd);

      const totalChange24hPercentage = totalValueUsd > 0 ? (totalChange24hUsd / (totalValueUsd - totalChange24hUsd)) * 100 : 0;

      return {
        totalValueUsd,
        totalChange24hUsd,
        totalChange24hPercentage,
        assets,
      };
    } catch (error) {
      console.error("[PortfolioCalculator] Error calculating portfolio:", error);
      const assets: PortfolioAssetItem[] = balances.map((b) => ({
        symbol: b.symbol,
        name: b.name,
        balance: b.balance,
        price: b.symbol === 'ETH' ? 3250.40 : 1.00,
        valueUsd: b.balance * (b.symbol === 'ETH' ? 3250.40 : 1.00),
        change24h: 0,
        address: b.address,
      }));
      const totalValueUsd = assets.reduce((sum, a) => sum + a.valueUsd, 0);
      return {
        totalValueUsd,
        totalChange24hUsd: 0,
        totalChange24hPercentage: 0,
        assets,
      };
    }
  }
}
