import { ethers } from "ethers";
import { ChainId, GasPriceData, TokenMetadata, UnsignedTransactionRequest } from "@/types/blockchain";
import { ProviderManager } from "@/providers/provider-manager";
import { blockchainCache } from "@/lib/blockchain-cache";
import { blockchainLogger } from "@/lib/blockchain-logger";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
];

export class BlockchainService {
  /**
   * Validate Ethereum / EVM compatible address with checksum support
   */
  static validateAddress(address: string): { isValid: boolean; checksumAddress?: string } {
    if (!address || typeof address !== "string") return { isValid: false };
    try {
      const clean = address.trim();
      if (!ethers.isAddress(clean)) return { isValid: false };
      return {
        isValid: true,
        checksumAddress: ethers.getAddress(clean),
      };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Get latest block number
   */
  static async getBlockNumber(chainId: ChainId): Promise<number> {
    const cacheKey = `block_number_${chainId}`;
    const cached = blockchainCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const provider = await ProviderManager.getProvider(chainId);
      const blockNumber = await provider.getBlockNumber();
      blockchainCache.set(cacheKey, blockNumber, 5000); // 5 sec TTL
      return blockNumber;
    } catch (err: any) {
      blockchainLogger.log('rpc', 'error', `Failed to fetch block number for chain ${chainId}`, err?.message);
      throw err;
    }
  }

  /**
   * Get native currency balance for address
   */
  static async getNativeBalance(chainId: ChainId, address: string): Promise<{ raw: string; formatted: string }> {
    const valid = this.validateAddress(address);
    if (!valid.isValid || !valid.checksumAddress) {
      throw new Error("Invalid wallet address provided");
    }

    try {
      const provider = await ProviderManager.getProvider(chainId);
      const balanceWei = await provider.getBalance(valid.checksumAddress);
      return {
        raw: balanceWei.toString(),
        formatted: ethers.formatEther(balanceWei),
      };
    } catch (err: any) {
      blockchainLogger.log('balance', 'error', `Failed to fetch native balance for ${address} on chain ${chainId}`, err?.message);
      throw err;
    }
  }

  /**
   * Get current gas prices and base fees
   */
  static async getGasPrice(chainId: ChainId): Promise<GasPriceData> {
    const cacheKey = `gas_price_${chainId}`;
    const cached = blockchainCache.get<GasPriceData>(cacheKey);
    if (cached) return cached;

    try {
      const provider = await ProviderManager.getProvider(chainId);
      const feeData = await provider.getFeeData();

      const gasPrice = feeData.gasPrice ? feeData.gasPrice.toString() : ethers.parseUnits("0.1", "gwei").toString();
      const maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas.toString() : undefined;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toString() : undefined;

      const result: GasPriceData = {
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedTimeSeconds: 15,
      };

      blockchainCache.set(cacheKey, result, 10000); // 10 sec TTL
      return result;
    } catch (err: any) {
      blockchainLogger.log('gas', 'error', `Failed to fetch gas price for chain ${chainId}`, err?.message);
      // Fallback default gas price
      return {
        gasPrice: ethers.parseUnits("0.1", "gwei").toString(),
        estimatedTimeSeconds: 15,
      };
    }
  }

  /**
   * Get transaction count (nonce)
   */
  static async getNonce(chainId: ChainId, address: string): Promise<number> {
    const valid = this.validateAddress(address);
    if (!valid.isValid || !valid.checksumAddress) throw new Error("Invalid address");

    const provider = await ProviderManager.getProvider(chainId);
    return await provider.getTransactionCount(valid.checksumAddress, "pending");
  }

  /**
   * Detect ERC-20 token metadata and balance
   */
  static async detectErc20Token(chainId: ChainId, contractAddress: string, walletAddress: string): Promise<TokenMetadata> {
    const validContract = this.validateAddress(contractAddress);
    const validWallet = this.validateAddress(walletAddress);

    if (!validContract.isValid || !validWallet.isValid || !validContract.checksumAddress || !validWallet.checksumAddress) {
      throw new Error("Invalid contract or wallet address for token detection");
    }

    const provider = await ProviderManager.getProvider(chainId);
    const contract = new ethers.Contract(validContract.checksumAddress, ERC20_ABI, provider);

    const [name, symbol, decimals, balance] = await Promise.all([
      contract.name().catch(() => "Unknown Token"),
      contract.symbol().catch(() => "UTKN"),
      contract.decimals().catch(() => 18),
      contract.balanceOf(validWallet.checksumAddress).catch(() => BigInt(0)),
    ]);

    const formatted = ethers.formatUnits(balance, decimals);

    return {
      contractAddress: validContract.checksumAddress,
      chainId,
      name,
      symbol,
      decimals: Number(decimals),
      balance: balance.toString(),
      formattedBalance: formatted,
    };
  }

  /**
   * Prepare unsigned native transfer transaction
   */
  static async prepareNativeTransfer(
    chainId: ChainId,
    senderAddress: string,
    recipientAddress: string,
    amountEther: string
  ): Promise<UnsignedTransactionRequest> {
    const validRecipient = this.validateAddress(recipientAddress);
    const validSender = this.validateAddress(senderAddress);

    if (!validRecipient.isValid || !validRecipient.checksumAddress) throw new Error("Invalid recipient address");
    if (!validSender.isValid || !validSender.checksumAddress) throw new Error("Invalid sender address");

    const [nonce, gasPriceData, provider] = await Promise.all([
      this.getNonce(chainId, validSender.checksumAddress),
      this.getGasPrice(chainId),
      ProviderManager.getProvider(chainId),
    ]);

    const valueWei = ethers.parseEther(amountEther);
    
    // Estimate gas for native transfer (standard 21000 limit)
    let gasLimit = BigInt(21000);
    try {
      const estimated = await provider.estimateGas({
        from: validSender.checksumAddress,
        to: validRecipient.checksumAddress,
        value: valueWei,
      });
      gasLimit = (estimated * BigInt(120)) / BigInt(100); // 20% buffer
    } catch {
      // default 21000
    }

    return {
      to: validRecipient.checksumAddress,
      value: valueWei.toString(),
      gasLimit: gasLimit.toString(),
      maxFeePerGas: gasPriceData.maxFeePerGas,
      maxPriorityFeePerGas: gasPriceData.maxPriorityFeePerGas,
      nonce,
      chainId,
    };
  }

  /**
   * Prepare unsigned ERC-20 token transfer transaction
   */
  static async prepareErc20Transfer(
    chainId: ChainId,
    senderAddress: string,
    tokenContractAddress: string,
    recipientAddress: string,
    amountFormatted: string,
    decimals = 18
  ): Promise<UnsignedTransactionRequest> {
    const validContract = this.validateAddress(tokenContractAddress);
    const validRecipient = this.validateAddress(recipientAddress);
    const validSender = this.validateAddress(senderAddress);

    if (!validContract.isValid || !validContract.checksumAddress) throw new Error("Invalid token contract address");
    if (!validRecipient.isValid || !validRecipient.checksumAddress) throw new Error("Invalid recipient address");
    if (!validSender.isValid || !validSender.checksumAddress) throw new Error("Invalid sender address");

    const amountWei = ethers.parseUnits(amountFormatted, decimals);
    const erc20Interface = new ethers.Interface([
      "function transfer(address to, uint256 amount) returns (bool)"
    ]);
    const data = erc20Interface.encodeFunctionData("transfer", [validRecipient.checksumAddress, amountWei]);

    const [nonce, gasPriceData, provider] = await Promise.all([
      this.getNonce(chainId, validSender.checksumAddress),
      this.getGasPrice(chainId),
      ProviderManager.getProvider(chainId),
    ]);

    let gasLimit = BigInt(65000);
    try {
      const estimated = await provider.estimateGas({
        from: validSender.checksumAddress,
        to: validContract.checksumAddress,
        data,
      });
      gasLimit = (estimated * BigInt(130)) / BigInt(100);
    } catch {
      // default
    }

    return {
      to: validContract.checksumAddress,
      value: "0",
      data,
      gasLimit: gasLimit.toString(),
      maxFeePerGas: gasPriceData.maxFeePerGas,
      maxPriorityFeePerGas: gasPriceData.maxPriorityFeePerGas,
      nonce,
      chainId,
    };
  }

  /**
   * Broadcast raw signed transaction hex to network
   */
  static async sendRawTransaction(chainId: ChainId, rawTxHex: string): Promise<string> {
    const provider = await ProviderManager.getProvider(chainId);
    const txResponse = await provider.broadcastTransaction(rawTxHex);
    blockchainLogger.log("tx_prep", "info", `Broadcasted transaction on chain ${chainId}`, { hash: txResponse.hash });

    return txResponse.hash;
  }

  /**
   * Get transaction receipt for a given tx hash
   */
  static async getTransactionReceipt(chainId: ChainId, txHash: string): Promise<ethers.TransactionReceipt | null> {
    const provider = await ProviderManager.getProvider(chainId);
    return await provider.getTransactionReceipt(txHash);
  }

  /**
   * Get latest block number for confirmation calculations
   */
  static async getLatestBlockNumber(chainId: ChainId): Promise<number> {
    return await this.getBlockNumber(chainId);
  }
}

