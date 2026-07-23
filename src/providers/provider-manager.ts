import { JsonRpcProvider } from "ethers";
import { ChainId } from "@/types/blockchain";
import { rpcManager } from "./rpc-manager";

export class ProviderManager {
  /**
   * Get an active Ethers JsonRpcProvider for a chain
   */
  static async getProvider(chainId: ChainId): Promise<JsonRpcProvider> {
    return await rpcManager.getProvider(chainId);
  }

  /**
   * Future WalletConnect provider integration placeholder
   */
  static getWalletConnectProvider(chainId: ChainId) {
    // Prepared for WalletConnect v2 / AppKit integration in future phases
    return {
      chainId,
      protocol: 'walletconnect',
      status: 'ready',
    };
  }

  /**
   * Future Hardware Wallet transport provider placeholder (Ledger / Trezor)
   */
  static getHardwareProvider(vendor: 'ledger' | 'trezor') {
    return {
      vendor,
      protocol: 'hid',
      status: 'ready',
    };
  }
}
