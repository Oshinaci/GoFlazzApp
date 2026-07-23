/**
 * Enterprise Event Decoder Service for GoFlazz
 * Decodes raw transaction logs into structured, user-friendly events
 * (Transfers, Approvals, Swaps, Deposits).
 */
import { ethers } from "ethers";
import { DecodedEvent } from "@/types/transaction";

const ERC20_TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const ERC20_APPROVAL_TOPIC = ethers.id("Approval(address,address,uint256)");
const WETH_DEPOSIT_TOPIC = ethers.id("Deposit(address,uint256)");

export class EventDecoderService {
  /**
   * Decode logs from a transaction receipt
   */
  static decodeLogs(logs: any[]): DecodedEvent[] {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return [];
    }

    const decodedEvents: DecodedEvent[] = [];

    for (const log of logs) {
      try {
        const topics = log.topics || [];
        if (topics.length === 0) continue;

        const mainTopic = topics[0];

        // 1. ERC-20 / ERC-721 Transfer(address indexed from, address indexed to, uint256 value)
        if (mainTopic === ERC20_TRANSFER_TOPIC && topics.length >= 3) {
          const from = ethers.getAddress(ethers.dataSlice(topics[1], 12));
          const to = ethers.getAddress(ethers.dataSlice(topics[2], 12));
          let valueWei = "0";

          if (log.data && log.data !== "0x") {
            valueWei = BigInt(log.data).toString();
          }

          const formattedValue = parseFloat(ethers.formatEther(valueWei)).toFixed(4);

          decodedEvents.push({
            eventName: "Transfer",
            contractAddress: log.address,
            from,
            to,
            valueWei,
            formattedValue,
            detailsSummary: `Transferred ${formattedValue} tokens from ${from.slice(0, 6)}...${from.slice(-4)} to ${to.slice(0, 6)}...${to.slice(-4)}`,
          });
        }
        // 2. ERC-20 Approval(address indexed owner, address indexed spender, uint256 value)
        else if (mainTopic === ERC20_APPROVAL_TOPIC && topics.length >= 3) {
          const owner = ethers.getAddress(ethers.dataSlice(topics[1], 12));
          const spender = ethers.getAddress(ethers.dataSlice(topics[2], 12));
          let valueWei = "0";

          if (log.data && log.data !== "0x") {
            valueWei = BigInt(log.data).toString();
          }

          const formattedValue = valueWei === ethers.MaxUint256.toString()
            ? "Unlimited"
            : parseFloat(ethers.formatEther(valueWei)).toFixed(4);

          decodedEvents.push({
            eventName: "Approval",
            contractAddress: log.address,
            owner,
            spender,
            valueWei,
            formattedValue,
            detailsSummary: `Approved ${spender.slice(0, 6)}...${spender.slice(-4)} to spend ${formattedValue} tokens`,
          });
        }
        // 3. WETH Deposit(address indexed dst, uint256 wad)
        else if (mainTopic === WETH_DEPOSIT_TOPIC && topics.length >= 2) {
          const dst = ethers.getAddress(ethers.dataSlice(topics[1], 12));
          const valueWei = BigInt(log.data || "0").toString();
          const formattedValue = parseFloat(ethers.formatEther(valueWei)).toFixed(4);

          decodedEvents.push({
            eventName: "Deposit",
            contractAddress: log.address,
            from: dst,
            valueWei,
            formattedValue,
            detailsSummary: `Wrapped ${formattedValue} ETH to WETH`,
          });
        } else {
          decodedEvents.push({
            eventName: "Unknown",
            contractAddress: log.address,
            detailsSummary: `Interaction with contract at ${log.address.slice(0, 8)}...`,
          });
        }
      } catch {
        // Continue parsing next log if one fails
      }
    }

    return decodedEvents;
  }
}
