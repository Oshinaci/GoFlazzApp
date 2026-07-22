import { NotificationsService } from "./notifications.service";

export interface TokenItem {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  priceUsd: number;
  logoUrl?: string;
  color: string;
  address: string;
  decimals: number;
}

export interface DexRoute {
  dexName: string;
  dexLogo: string;
  rate: number;
  amountOut: number;
  amountOutUsd: number;
  estimatedGasUsd: number;
  priceImpactPercent: number;
  isBestRate: boolean;
  routingPath: string[];
}

export interface SwapQuoteRequest {
  fromToken: TokenItem;
  toToken: TokenItem;
  amountIn: number;
  slippageTolerance: number; // e.g. 0.5%
}

export interface SwapExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  amountIn: number;
  amountOut: number;
  fromSymbol: string;
  toSymbol: string;
  routeUsed: string;
}

export const SUPPORTED_SWAP_TOKENS: TokenItem[] = [
  { id: "eth", symbol: "ETH", name: "Ethereum", balance: 2.145, priceUsd: 3350.0, color: "#627EEA", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
  { id: "arb", symbol: "ARB", name: "Arbitrum", balance: 3200, priceUsd: 0.84, color: "#28A0F0", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
  { id: "usdc", symbol: "USDC", name: "USD Coin", balance: 2611.88, priceUsd: 1.0, color: "#2775CA", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
  { id: "usdt", symbol: "USDT", name: "Tether USD", balance: 1450.0, priceUsd: 1.0, color: "#26A17B", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
  { id: "flz", symbol: "FLZ", name: "GoFlazz Utility", balance: 12500, priceUsd: 0.24, color: "#8B5CF6", address: "0x1234567890abcdef1234567890abcdef12345678", decimals: 18 },
  { id: "wbtc", symbol: "WBTC", name: "Wrapped BTC", balance: 0.15, priceUsd: 64200.0, color: "#F7931A", address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8 },
  { id: "link", symbol: "LINK", name: "Chainlink", balance: 180, priceUsd: 14.2, color: "#375BD2", address: "0xf97f4df75117a03679088cc05335198205f9c5a6", decimals: 18 },
];

export class SwapService {
  /**
   * Aggregate quotes across multiple decentralized exchange protocols (Uniswap V3, 1inch, Matcha, Sushiswap, QuickSwap)
   */
  static getAggregatedQuotes(req: SwapQuoteRequest): DexRoute[] {
    const { fromToken, toToken, amountIn } = req;
    if (!amountIn || amountIn <= 0) return [];

    const valueInUsd = amountIn * fromToken.priceUsd;
    const baseAmountOut = valueInUsd / toToken.priceUsd;

    const dexes = [
      { name: "Uniswap V3", logo: "🦄", feeRate: 0.9985, gasUsd: 3.2, path: [fromToken.symbol, "USDC", toToken.symbol] },
      { name: "1inch Aggregator", logo: "🦄", feeRate: 0.9992, gasUsd: 2.8, path: [fromToken.symbol, toToken.symbol] },
      { name: "Matcha (0x Protocol)", logo: "🍵", feeRate: 0.9988, gasUsd: 3.0, path: [fromToken.symbol, toToken.symbol] },
      { name: "Sushiswap V2", logo: "🍣", feeRate: 0.997, gasUsd: 3.8, path: [fromToken.symbol, "WETH", toToken.symbol] },
      { name: "QuickSwap V3", logo: "⚡", feeRate: 0.9975, gasUsd: 1.5, path: [fromToken.symbol, toToken.symbol] },
    ];

    const routes: DexRoute[] = dexes.map((dex) => {
      const amountOut = baseAmountOut * dex.feeRate;
      const rate = amountOut / amountIn;
      const amountOutUsd = amountOut * toToken.priceUsd;
      const priceImpactPercent = Math.max(0.01, parseFloat(((1 - dex.feeRate) * 100).toFixed(2)));

      return {
        dexName: dex.name,
        dexLogo: dex.logo,
        rate,
        amountOut,
        amountOutUsd,
        estimatedGasUsd: dex.gasUsd,
        priceImpactPercent,
        isBestRate: false,
        routingPath: dex.path,
      };
    });

    // Mark best rate
    routes.sort((a, b) => b.amountOut - a.amountOut);
    if (routes.length > 0) {
      routes[0].isBestRate = true;
    }

    return routes;
  }

  /**
   * Execute token swap transaction
   */
  static async executeSwap(
    req: SwapQuoteRequest,
    selectedRoute: DexRoute
  ): Promise<SwapExecutionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomHex = Math.random().toString(16).substring(2, 10);
        const txHash = `0x${randomHex}${Math.random().toString(16).substring(2, 34)}`;

        // Add notification
        NotificationsService.addNotification(
          "transaction",
          `Swapped ${req.amountIn} ${req.fromToken.symbol} for ${selectedRoute.amountOut.toFixed(4)} ${req.toToken.symbol}`,
          `Executed via ${selectedRoute.dexName} (Tx: ${txHash.slice(0, 8)}...${txHash.slice(-6)})`,
          "/activity"
        );

        resolve({
          success: true,
          txHash,
          amountIn: req.amountIn,
          amountOut: selectedRoute.amountOut,
          fromSymbol: req.fromToken.symbol,
          toSymbol: req.toToken.symbol,
          routeUsed: selectedRoute.dexName,
        });
      }, 1500);
    });
  }
}
