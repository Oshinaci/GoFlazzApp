export interface ExplorerTx {
  txHash: string;
  blockNumber: number;
  from: string;
  to: string;
  valueEth: number;
  gasUsed: number;
  gasPriceGwei: number;
  status: "Success" | "Pending" | "Failed";
  timestamp: string;
  method: string;
  network: string;
}

export interface ExplorerBlock {
  blockNumber: number;
  hash: string;
  miner: string;
  txCount: number;
  gasUsed: string;
  timestamp: string;
  rewardEth: number;
}

export interface ExplorerAddressResult {
  address: string;
  balanceEth: number;
  balanceUsd: number;
  txCount: number;
  isContract: boolean;
  contractName?: string;
  tokens: { symbol: string; balance: number; valueUsd: number }[];
  recentTxs: ExplorerTx[];
}

export class ExplorerService {
  /**
   * Search query: returns classification type (tx, address, block, or unknown)
   */
  static classifyQuery(query: string): "tx" | "address" | "block" | "unknown" {
    const q = query.trim();
    if (/^0x([A-Fa-f0-9]{64})$/.test(q)) return "tx";
    if (/^0x[a-fA-F0-9]{40}$/.test(q)) return "address";
    if (/^\d+$/.test(q)) return "block";
    return "unknown";
  }

  /**
   * Get transaction details by hash
   */
  static getTxDetails(hash: string): ExplorerTx {
    return {
      txHash: hash.startsWith("0x") ? hash : `0x${hash}`,
      blockNumber: 19842105,
      from: "0x71C7329EC2A2f932828b813b1853B8A88a2F39A2",
      to: "0x8f2a7219bc82d0291938bc1982b1892837bc19bC",
      valueEth: 0.42,
      gasUsed: 21000,
      gasPriceGwei: 16.4,
      status: "Success",
      timestamp: "12 mins ago (Jul 22, 2026, 08:14:22 AM UTC)",
      method: "Transfer",
      network: "Ethereum Mainnet",
    };
  }

  /**
   * Get block details by number
   */
  static getBlockDetails(blockNum: number): ExplorerBlock {
    return {
      blockNumber: blockNum,
      hash: `0x89f2a${Math.random().toString(16).substring(2, 34)}`,
      miner: "BeaverBuild (0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5)",
      txCount: 184,
      gasUsed: "14,892,102 (49.6%)",
      timestamp: "18 secs ago",
      rewardEth: 0.084,
    };
  }

  /**
   * Get address details and assets
   */
  static getAddressDetails(address: string): ExplorerAddressResult {
    return {
      address,
      balanceEth: 2.145,
      balanceUsd: 7185.75,
      txCount: 48,
      isContract: false,
      tokens: [
        { symbol: "ETH", balance: 2.145, valueUsd: 7185.75 },
        { symbol: "ARB", balance: 3200, valueUsd: 2688.0 },
        { symbol: "USDC", balance: 2611.88, valueUsd: 2611.88 },
        { symbol: "FLZ", balance: 12500, valueUsd: 3000.0 },
      ],
      recentTxs: [
        {
          txHash: "0x8f2a9381c19283bc928172bc912837bc19bC84a123bc",
          blockNumber: 19842105,
          from: "0x8f2a7219bc82d0291938bc1982b1892837bc19bC",
          to: address,
          valueEth: 0.42,
          gasUsed: 21000,
          gasPriceGwei: 16.2,
          status: "Success",
          timestamp: "10 mins ago",
          method: "Transfer",
          network: "Ethereum Mainnet",
        },
        {
          txHash: "0x1a3f7ce29381287381273912837bc19bC84a8893a12",
          blockNumber: 19841890,
          from: address,
          to: "0x1a3F7cE22938127381273912837bc19bC84a8893",
          valueEth: 0.15,
          gasUsed: 65000,
          gasPriceGwei: 18.0,
          status: "Success",
          timestamp: "3 hours ago",
          method: "Swap (Uniswap)",
          network: "Ethereum Mainnet",
        },
      ],
    };
  }

  /**
   * Get recent latest blocks for explorer feed
   */
  static getRecentBlocks(): ExplorerBlock[] {
    const current = 19842105;
    return [
      { blockNumber: current, hash: "0x89f2a93...", miner: "BeaverBuild", txCount: 192, gasUsed: "52%", timestamp: "12s ago", rewardEth: 0.082 },
      { blockNumber: current - 1, hash: "0x72c10b2...", miner: "Titan Builder", txCount: 164, gasUsed: "48%", timestamp: "24s ago", rewardEth: 0.071 },
      { blockNumber: current - 2, hash: "0x12a99c4...", miner: "rsync-builder", txCount: 218, gasUsed: "61%", timestamp: "36s ago", rewardEth: 0.095 },
      { blockNumber: current - 3, hash: "0x98f331a...", miner: "Flashbots", txCount: 145, gasUsed: "41%", timestamp: "48s ago", rewardEth: 0.064 },
    ];
  }
}
