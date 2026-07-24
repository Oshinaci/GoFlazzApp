export interface NetworkConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    rpcUrl: "https://eth.llamarpc.com",
    chainId: 1,
    explorerUrl: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  }
};

export class NetworkService {
  static getNetworkConfig(networkId: string): NetworkConfig {
    return NETWORKS[networkId] || NETWORKS["arbitrum"];
  }
}
