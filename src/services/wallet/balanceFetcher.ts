import { ethers } from "ethers";
import { NetworkService } from "./network.service";
import { TokenConfig } from "./tokenDiscovery";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

export interface FetchedBalance {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  address: string | null; // null for native ETH
}

export class BalanceFetcherService {
  static async getBalances(walletAddress: string, networkId: string, tokens: TokenConfig[]): Promise<FetchedBalance[]> {
    try {
      const config = NetworkService.getNetworkConfig(networkId);
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);

      // We use Promise.all to fetch ETH and all ERC20 balances in parallel
      const fetchNative = async (): Promise<FetchedBalance> => {
        const bal = await provider.getBalance(walletAddress);
        return {
          symbol: config.nativeCurrency.symbol,
          name: config.nativeCurrency.name,
          balance: parseFloat(ethers.formatUnits(bal, config.nativeCurrency.decimals)),
          decimals: config.nativeCurrency.decimals,
          address: null,
        };
      };

      const fetchToken = async (token: TokenConfig): Promise<FetchedBalance> => {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const bal = await contract.balanceOf(walletAddress);
          return {
            symbol: token.symbol,
            name: token.name,
            balance: parseFloat(ethers.formatUnits(bal, token.decimals)),
            decimals: token.decimals,
            address: token.address,
          };
        } catch (error) {
          console.warn(`Failed to fetch balance for ${token.symbol}`, error);
          return {
            symbol: token.symbol,
            name: token.name,
            balance: 0,
            decimals: token.decimals,
            address: token.address,
          };
        }
      };

      const results = await Promise.all([
        fetchNative(),
        ...tokens.map((t) => fetchToken(t)),
      ]);

      return results;
    } catch (error) {
      console.error("[BalanceFetcherService] Error fetching balances:", error);
      throw error;
    }
  }
}
