import { TradingPerformanceStats, LeaderboardUser } from "./perpetual.types";

export class PerpetualPerformanceService {
  static getPerformanceStats(): TradingPerformanceStats {
    return {
      dailyPnl: 1443.20,
      weeklyPnl: 4890.50,
      winRate: 72.4,
      averageReturn: 6.8,
      largestWin: 2150.00,
      largestLoss: -480.00,
      totalTrades: 84,
      profitableTrades: 61,
    };
  }

  static getLeaderboard(): LeaderboardUser[] {
    return [
      { rank: 1, username: "ArbWhale_99", avatar: "🐋", pnl: 142850.20, roi: 840.5, winRate: 81.2 },
      { rank: 2, username: "CryptoNinja_X", avatar: "🥷", pnl: 98420.00, roi: 620.1, winRate: 76.5 },
      { rank: 3, username: "GoFlazzMaster", avatar: "⚡", pnl: 74150.80, roi: 540.3, winRate: 72.4 },
      { rank: 4, username: "EtherViper", avatar: "🐍", pnl: 52900.50, roi: 410.8, winRate: 69.1 },
      { rank: 5, username: "SatoshiAlpha", avatar: "🪐", pnl: 41200.00, roi: 350.2, winRate: 67.8 },
    ];
  }
}
