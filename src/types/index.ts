export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  valueUsd: number;
  changePercent24h: number;
  color: string;
}

export type ActivityType = "send" | "receive" | "pay";
export type ActivityStatus = "completed" | "pending" | "failed";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  label: string;
  counterparty: string;
  amount: number;
  symbol: string;
  date: string;
  status: ActivityStatus;
}

export interface BalancePoint {
  date: string;
  value: number;
}

export type QuickActionId = "send" | "receive" | "pay";
