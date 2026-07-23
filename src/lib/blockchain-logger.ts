import { BlockchainLog } from "@/types/blockchain";

class BlockchainLogger {
  private logs: BlockchainLog[] = [];
  private maxLogs = 500;

  log(category: BlockchainLog['category'], level: BlockchainLog['level'], message: string, metadata?: any) {
    const entry: BlockchainLog = {
      timestamp: new Date().toISOString(),
      category,
      level,
      message,
      metadata,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (level === 'error') {
      console.error(`[BlockchainEngine:${category.toUpperCase()}]`, message, metadata || '');
    } else if (level === 'warn') {
      console.warn(`[BlockchainEngine:${category.toUpperCase()}]`, message, metadata || '');
    }
  }

  getLogs(): BlockchainLog[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const blockchainLogger = new BlockchainLogger();
