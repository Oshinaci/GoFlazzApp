/**
 * Token Logo Engine Service for GoFlazz
 * Fetches, caches, and provides fallback icons (Chain Icon, Generic Token Icon).
 */

const LOGO_CACHE_KEY = "goflazz_token_logo_cache";

export interface LogoCacheEntry {
  symbol: string;
  url: string;
  fallbackType: "coingecko" | "trustwallet" | "chain" | "generic";
  lastUpdated: string;
}

export class TokenLogoEngine {
  private static DEFAULT_CHAIN_LOGOS: Record<string, string> = {
    ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    BTC: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    ARB: "https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png",
    POL: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
    BNB: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    AVAX: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
    SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    USDT: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
    FLZ: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  };

  /**
   * Get logo URL for a token symbol with automatic fallback resolution
   */
  static getTokenLogoUrl(symbol: string, primaryUrl?: string, chainSymbol?: string): string {
    const sym = symbol.toUpperCase();

    // 1. Primary explicit logo URL
    if (primaryUrl && primaryUrl.trim() !== "") {
      return primaryUrl;
    }

    // 2. Default known chain logo map
    if (this.DEFAULT_CHAIN_LOGOS[sym]) {
      return this.DEFAULT_CHAIN_LOGOS[sym];
    }

    // 3. TrustWallet assets CDN fallback
    const trustWalletUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${sym}/logo.png`;

    // 4. Fallback chain logo
    if (chainSymbol && this.DEFAULT_CHAIN_LOGOS[chainSymbol.toUpperCase()]) {
      return this.DEFAULT_CHAIN_LOGOS[chainSymbol.toUpperCase()];
    }

    // 5. Generic SVG avatar placeholder
    return `https://avatar.vercel.sh/${sym}.svg?text=${sym.slice(0, 3)}`;
  }

  /**
   * Refresh cached logo
   */
  static refreshLogoCache(symbol: string): void {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(LOGO_CACHE_KEY);
      const cache: Record<string, LogoCacheEntry> = stored ? JSON.parse(stored) : {};
      delete cache[symbol.toUpperCase()];
      localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cache));
    } catch (_) {}
  }
}
