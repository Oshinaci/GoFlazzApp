import type { Asset, ActivityItem, BalancePoint } from "@/types";

export const SIMULATED_TOTAL_BALANCE_USD = 12480.32;

export const mockBalanceHistory: BalancePoint[] = [
  { date: "Mon", value: 11890 },
  { date: "Tue", value: 12010 },
  { date: "Wed", value: 11740 },
  { date: "Thu", value: 12210 },
  { date: "Fri", value: 12005 },
  { date: "Sat", value: 12360 },
  { date: "Sun", value: 12480.32 },
];

export const mockAssets: Asset[] = [
  { id: "eth", symbol: "ETH", name: "Ethereum", balance: 2.145, valueUsd: 7180.44, changePercent24h: 1.8, color: "#627EEA" },
  { id: "arb", symbol: "ARB", name: "Arbitrum", balance: 3200, valueUsd: 2688.0, changePercent24h: -2.4, color: "#28A0F0" },
  { id: "usdc", symbol: "USDC", name: "USD Coin", balance: 2611.88, valueUsd: 2611.88, changePercent24h: 0.0, color: "#2775CA" },
];

export const mockActivity: ActivityItem[] = [
  { id: "a1", type: "receive", label: "Received", counterparty: "0x8f2a…19bC", amount: 0.42, symbol: "ETH", date: "Today, 10:24 AM", status: "completed" },
  { id: "a2", type: "pay", label: "Paid", counterparty: "Warung Kopi Senja", amount: 45000, symbol: "IDR", date: "Today, 8:02 AM", status: "completed" },
  { id: "a3", type: "send", label: "Sent", counterparty: "0x1a3F…7cE2", amount: 150, symbol: "ARB", date: "Yesterday, 6:45 PM", status: "completed" },
  { id: "a4", type: "receive", label: "Received", counterparty: "0x9d4B…22aA", amount: 500, symbol: "USDC", date: "Yesterday, 2:10 PM", status: "completed" },
  { id: "a5", type: "send", label: "Sent", counterparty: "0x5c1D…88Fe", amount: 0.1, symbol: "ETH", date: "2 days ago", status: "pending" },
  { id: "a6", type: "pay", label: "Payment failed", counterparty: "Toko Elektronik Jaya", amount: 120000, symbol: "IDR", date: "3 days ago", status: "failed" },
];
