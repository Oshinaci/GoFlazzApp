import { ChainId, NetworkConfig } from "@/types/blockchain";

export const SUPPORTED_NETWORKS: Record<ChainId, NetworkConfig> = {
  42161: {
    chainId: 42161,
    name: "Arbitrum One",
    networkKey: "arbitrum",
    rpcUrls: {
      primary: "https://arb1.arbitrum.io/rpc",
      backup: "https://arbitrum-one.publicnode.com",
    },
    blockExplorerUrl: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    isTestnet: false,
    isDefault: true,
  },
  1: {
    chainId: 1,
    name: "Ethereum Mainnet",
    networkKey: "ethereum",
    rpcUrls: {
      primary: "https://cloudflare-eth.com",
      backup: "https://rpc.ankr.com/eth",
    },
    blockExplorerUrl: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    isTestnet: false,
  },
  8453: {
    chainId: 8453,
    name: "Base",
    networkKey: "base",
    rpcUrls: {
      primary: "https://mainnet.base.org",
      backup: "https://base.llamarpc.com",
    },
    blockExplorerUrl: "https://basescan.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    isTestnet: false,
  },
  10: {
    chainId: 10,
    name: "Optimism",
    networkKey: "optimism",
    rpcUrls: {
      primary: "https://mainnet.optimism.io",
      backup: "https://rpc.ankr.com/optimism",
    },
    blockExplorerUrl: "https://optimistic.etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    isTestnet: false,
  },
  137: {
    chainId: 137,
    name: "Polygon PoS",
    networkKey: "polygon",
    rpcUrls: {
      primary: "https://polygon-rpc.com",
      backup: "https://rpc-mainnet.maticvigil.com",
    },
    blockExplorerUrl: "https://polygonscan.com",
    nativeCurrency: {
      name: "Polygon Ecosystem Token",
      symbol: "POL",
      decimals: 18,
      logoUrl: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
    },
    isTestnet: false,
  },
  56: {
    chainId: 56,
    name: "BNB Smart Chain",
    networkKey: "bsc",
    rpcUrls: {
      primary: "https://bsc-dataseed1.binance.org",
      backup: "https://bsc-dataseed2.binance.org",
    },
    blockExplorerUrl: "https://bscscan.com",
    nativeCurrency: {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
      logoUrl: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    },
    isTestnet: false,
  },
  43114: {
    chainId: 43114,
    name: "Avalanche C-Chain",
    networkKey: "avalanche",
    rpcUrls: {
      primary: "https://api.avax.network/ext/bc/C/rpc",
      backup: "https://rpc.ankr.com/avalanche",
    },
    blockExplorerUrl: "https://snowtrace.io",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
      logoUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    isTestnet: false,
  },
};
