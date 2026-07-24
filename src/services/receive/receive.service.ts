import { NetworkOption } from "./receive.types";

export class ReceiveService {
  static getSupportedNetworks(): NetworkOption[] {
    return [
      {
        id: "arbitrum",
        name: "Arbitrum One",
        symbol: "ETH",
        chainId: 42161,
        isActive: true,
        iconName: "⚡",
        nativeCurrency: "ETH",
      },
      {
        id: "ethereum",
        name: "Ethereum Mainnet",
        symbol: "ETH",
        chainId: 1,
        isActive: false,
        iconName: "🔷",
        nativeCurrency: "ETH",
      },
      {
        id: "base",
        name: "Base",
        symbol: "ETH",
        chainId: 8453,
        isActive: false,
        iconName: "🔵",
        nativeCurrency: "ETH",
      },
      {
        id: "optimism",
        name: "Optimism",
        symbol: "ETH",
        chainId: 10,
        isActive: false,
        iconName: "🔴",
        nativeCurrency: "ETH",
      },
      {
        id: "polygon",
        name: "Polygon PoS",
        symbol: "POL",
        chainId: 137,
        isActive: false,
        iconName: "💜",
        nativeCurrency: "POL",
      },
      {
        id: "bnb",
        name: "BNB Smart Chain",
        symbol: "BNB",
        chainId: 56,
        isActive: false,
        iconName: "🟡",
        nativeCurrency: "BNB",
      },
      {
        id: "avalanche",
        name: "Avalanche C-Chain",
        symbol: "AVAX",
        chainId: 43114,
        isActive: false,
        iconName: "❄️",
        nativeCurrency: "AVAX",
      },
    ];
  }
}
