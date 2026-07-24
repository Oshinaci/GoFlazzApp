export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  networkId: string;
}

// Minimal list of Arbitrum tokens we want to auto-detect
export const KNOWN_TOKENS: TokenConfig[] = [
  {
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    networkId: "arbitrum"
  },
  {
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    networkId: "arbitrum"
  },
  {
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    symbol: "ARB",
    name: "Arbitrum",
    decimals: 18,
    networkId: "arbitrum"
  },
  {
    address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    symbol: "WBTC",
    name: "Wrapped BTC",
    decimals: 8,
    networkId: "arbitrum"
  },
  {
    address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
    networkId: "arbitrum"
  },
  {
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    networkId: "arbitrum"
  }
];

export class TokenDiscoveryService {
  static getKnownTokens(networkId: string): TokenConfig[] {
    return KNOWN_TOKENS.filter((t) => t.networkId === networkId);
  }
}
