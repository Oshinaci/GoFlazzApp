/**
 * Production-Ready Transaction Builder for GoFlazz
 * Builds unsigned transaction requests, integrates Gas Engine, Nonce Manager,
 * Fee Estimator, Transaction Validator, and Simulation Engine.
 */
import { ethers } from "ethers";
import { ChainId, UnsignedTransactionRequest } from "@/types/blockchain";
import {
  FeeBreakdown,
  GasEngineResult,
  QueuedTransactionItem,
  SimulationResult,
  TransactionType,
  ValidationResult,
} from "@/types/transaction";
import { BlockchainService } from "@/services/blockchain.service";
import { GasEngineService } from "@/services/gas-engine.service";
import { NonceManagerService } from "@/services/nonce-manager.service";
import { FeeEstimatorService } from "@/services/fee-estimator.service";
import { TransactionSimulatorService } from "@/services/transaction-simulator.service";
import { TransactionValidatorService } from "@/services/transaction-validator.service";
import { TransactionQueueService } from "@/services/transaction-queue.service";

export interface PreparedTransactionPackage {
  unsignedTx: UnsignedTransactionRequest;
  feeBreakdown: FeeBreakdown;
  gasRecommendations: GasEngineResult;
  validation: ValidationResult;
  simulation: SimulationResult;
  queuedItem: QueuedTransactionItem;
}

export class TransactionBuilderService {
  /**
   * Build unsigned native transfer package (ETH / POL / BNB / AVAX)
   */
  static async buildNativeTransfer(
    senderAddress: string,
    recipientAddress: string,
    amountFormatted: string,
    chainId: ChainId,
    speed: "slow" | "standard" | "fast" = "standard",
    userId?: string
  ): Promise<PreparedTransactionPackage> {
    const validSender = BlockchainService.validateAddress(senderAddress);
    const validRecipient = BlockchainService.validateAddress(recipientAddress);

    if (!validSender.isValid || !validSender.checksumAddress) throw new Error("Invalid sender address");
    if (!validRecipient.isValid || !validRecipient.checksumAddress) throw new Error("Invalid recipient address");

    const valueWei = ethers.parseEther(amountFormatted);
    const nonce = await NonceManagerService.getNextNonce(chainId, validSender.checksumAddress);

    // Initial Gas estimation
    const gasRecommendations = await GasEngineService.getGasRecommendations(chainId, "21000");
    const chosenSpeed = gasRecommendations[speed];

    const unsignedTx: UnsignedTransactionRequest = {
      to: validRecipient.checksumAddress,
      value: valueWei.toString(),
      data: "0x",
      gasLimit: gasRecommendations.gasLimit,
      maxFeePerGas: chosenSpeed.maxFeePerGas,
      maxPriorityFeePerGas: chosenSpeed.maxPriorityFeePerGas,
      nonce,
      chainId,
    };

    // Validation & Simulation
    const validation = await TransactionValidatorService.validateTransaction(validSender.checksumAddress, unsignedTx);
    const simulation = await TransactionSimulatorService.simulateTransaction(validSender.checksumAddress, unsignedTx);

    // Update gasLimit if simulated gas was higher
    if (simulation.isSuccess && BigInt(simulation.gasUsed) > BigInt(21000)) {
      unsignedTx.gasLimit = GasEngineService.applyGasLimitBuffer(BigInt(simulation.gasUsed));
    }

    const feeBreakdown = await FeeEstimatorService.calculateFeeBreakdown(
      chainId,
      unsignedTx.gasLimit || "21000",
      unsignedTx.maxFeePerGas || "100000000",
      unsignedTx.maxPriorityFeePerGas || "10000000"
    );

    const queuedItem = await TransactionQueueService.enqueueTransaction({
      userId,
      walletAddress: validSender.checksumAddress,
      chainId,
      type: "native_transfer",
      status: "ready",
      to: validRecipient.checksumAddress,
      valueWei: valueWei.toString(),
      nonce,
      gasLimit: unsignedTx.gasLimit,
      maxFeePerGas: unsignedTx.maxFeePerGas,
      maxPriorityFeePerGas: unsignedTx.maxPriorityFeePerGas,
      feeEstimateUsd: feeBreakdown.estimatedFeeUsd,
      simulationResult: simulation,
    });

    return {
      unsignedTx,
      feeBreakdown,
      gasRecommendations,
      validation,
      simulation,
      queuedItem,
    };
  }

  /**
   * Build unsigned ERC-20 transfer package
   */
  static async buildErc20Transfer(
    senderAddress: string,
    tokenContractAddress: string,
    recipientAddress: string,
    amountFormatted: string,
    decimals = 18,
    symbol = "ERC20",
    chainId: ChainId = 42161,
    speed: "slow" | "standard" | "fast" = "standard",
    userId?: string
  ): Promise<PreparedTransactionPackage> {
    const validSender = BlockchainService.validateAddress(senderAddress);
    const validContract = BlockchainService.validateAddress(tokenContractAddress);
    const validRecipient = BlockchainService.validateAddress(recipientAddress);

    if (!validSender.isValid || !validSender.checksumAddress) throw new Error("Invalid sender address");
    if (!validContract.isValid || !validContract.checksumAddress) throw new Error("Invalid token contract");
    if (!validRecipient.isValid || !validRecipient.checksumAddress) throw new Error("Invalid recipient address");

    const amountWei = ethers.parseUnits(amountFormatted, decimals);
    const erc20Interface = new ethers.Interface(["function transfer(address to, uint256 amount) returns (bool)"]);
    const data = erc20Interface.encodeFunctionData("transfer", [validRecipient.checksumAddress, amountWei]);

    const nonce = await NonceManagerService.getNextNonce(chainId, validSender.checksumAddress);
    const gasRecommendations = await GasEngineService.getGasRecommendations(chainId, "65000");
    const chosenSpeed = gasRecommendations[speed];

    const unsignedTx: UnsignedTransactionRequest = {
      to: validContract.checksumAddress,
      value: "0",
      data,
      gasLimit: "65000",
      maxFeePerGas: chosenSpeed.maxFeePerGas,
      maxPriorityFeePerGas: chosenSpeed.maxPriorityFeePerGas,
      nonce,
      chainId,
    };

    const validation = await TransactionValidatorService.validateTransaction(validSender.checksumAddress, unsignedTx);
    const simulation = await TransactionSimulatorService.simulateTransaction(validSender.checksumAddress, unsignedTx);

    if (simulation.isSuccess && BigInt(simulation.gasUsed) > BigInt(0)) {
      unsignedTx.gasLimit = GasEngineService.applyGasLimitBuffer(BigInt(simulation.gasUsed));
    }

    const feeBreakdown = await FeeEstimatorService.calculateFeeBreakdown(
      chainId,
      unsignedTx.gasLimit || "65000",
      unsignedTx.maxFeePerGas || "100000000",
      unsignedTx.maxPriorityFeePerGas || "10000000"
    );

    const queuedItem = await TransactionQueueService.enqueueTransaction({
      userId,
      walletAddress: validSender.checksumAddress,
      chainId,
      type: "erc20_transfer",
      status: "ready",
      to: validRecipient.checksumAddress,
      valueWei: amountWei.toString(),
      data,
      tokenSymbol: symbol,
      tokenContractAddress: validContract.checksumAddress,
      nonce,
      gasLimit: unsignedTx.gasLimit,
      maxFeePerGas: unsignedTx.maxFeePerGas,
      maxPriorityFeePerGas: unsignedTx.maxPriorityFeePerGas,
      feeEstimateUsd: feeBreakdown.estimatedFeeUsd,
      simulationResult: simulation,
    });

    return {
      unsignedTx,
      feeBreakdown,
      gasRecommendations,
      validation,
      simulation,
      queuedItem,
    };
  }

  /**
   * Build unsigned token approval package
   */
  static async buildTokenApproval(
    senderAddress: string,
    tokenContractAddress: string,
    spenderAddress: string,
    amountFormatted: string,
    decimals = 18,
    symbol = "ERC20",
    chainId: ChainId = 42161,
    userId?: string
  ): Promise<PreparedTransactionPackage> {
    const validSender = BlockchainService.validateAddress(senderAddress);
    const validContract = BlockchainService.validateAddress(tokenContractAddress);
    const validSpender = BlockchainService.validateAddress(spenderAddress);

    if (!validSender.isValid || !validSender.checksumAddress) throw new Error("Invalid sender address");
    if (!validContract.isValid || !validContract.checksumAddress) throw new Error("Invalid token contract");
    if (!validSpender.isValid || !validSpender.checksumAddress) throw new Error("Invalid spender address");

    const amountWei = ethers.parseUnits(amountFormatted, decimals);
    const erc20Interface = new ethers.Interface(["function approve(address spender, uint256 amount) returns (bool)"]);
    const data = erc20Interface.encodeFunctionData("approve", [validSpender.checksumAddress, amountWei]);

    const nonce = await NonceManagerService.getNextNonce(chainId, validSender.checksumAddress);
    const gasRecommendations = await GasEngineService.getGasRecommendations(chainId, "50000");

    const unsignedTx: UnsignedTransactionRequest = {
      to: validContract.checksumAddress,
      value: "0",
      data,
      gasLimit: "50000",
      maxFeePerGas: gasRecommendations.standard.maxFeePerGas,
      maxPriorityFeePerGas: gasRecommendations.standard.maxPriorityFeePerGas,
      nonce,
      chainId,
    };

    const validation = await TransactionValidatorService.validateTransaction(validSender.checksumAddress, unsignedTx);
    const simulation = await TransactionSimulatorService.simulateTransaction(validSender.checksumAddress, unsignedTx);

    const feeBreakdown = await FeeEstimatorService.calculateFeeBreakdown(
      chainId,
      unsignedTx.gasLimit || "50000",
      unsignedTx.maxFeePerGas || "100000000",
      unsignedTx.maxPriorityFeePerGas || "10000000"
    );

    const queuedItem = await TransactionQueueService.enqueueTransaction({
      userId,
      walletAddress: validSender.checksumAddress,
      chainId,
      type: "token_approval",
      status: "ready",
      to: validSpender.checksumAddress,
      valueWei: amountWei.toString(),
      data,
      tokenSymbol: symbol,
      tokenContractAddress: validContract.checksumAddress,
      nonce,
      gasLimit: unsignedTx.gasLimit,
      maxFeePerGas: unsignedTx.maxFeePerGas,
      maxPriorityFeePerGas: unsignedTx.maxPriorityFeePerGas,
      feeEstimateUsd: feeBreakdown.estimatedFeeUsd,
      simulationResult: simulation,
    });

    return {
      unsignedTx,
      feeBreakdown,
      gasRecommendations,
      validation,
      simulation,
      queuedItem,
    };
  }
}
