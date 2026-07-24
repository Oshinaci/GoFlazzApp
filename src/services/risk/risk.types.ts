export type MarginMode = "cross" | "isolated";

export type PositionHealthStatus = "healthy" | "warning" | "danger" | "critical" | "liquidating";

export interface MarginSummary {
  totalEquity: number;
  initialMargin: number;
  maintenanceMargin: number;
  availableMargin: number;
  usedMargin: number;
  freeMargin: number;
  marginRatio: number; // percentage e.g. 15.5%
  marginUtilization: number; // percentage e.g. 45.2%
  buyingPower: number;
  marginBuffer: number;
}

export interface LeverageConfig {
  marketSymbol: string;
  minLeverage: number;
  maxLeverage: number;
  defaultLeverage: number;
  currentLeverage: number;
  maintenanceMarginRate: number;
}

export interface LiquidationDetails {
  marketSymbol: string;
  side: "long" | "short";
  entryPrice: number;
  markPrice: number;
  leverage: number;
  size: number;
  margin: number;
  liquidationPrice: number;
  distancePercentage: number;
  estimatedLoss: number;
  healthStatus: PositionHealthStatus;
}

export interface FundingRecord {
  marketSymbol: string;
  fundingRate: number; // e.g. 0.0001 (0.01%)
  nextFundingTime: string;
  estimatedPayment: number;
  paymentIntervalHours: number;
  historicalRates: { timestamp: string; rate: number }[];
}

export interface PnLRecord {
  realizedPnl: number;
  unrealizedPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  roi: number; // Return on Investment %
  roe: number; // Return on Equity %
  averageEntryPrice: number;
  averageExitPrice: number;
}

export interface RiskAssessment {
  riskScore: number; // 0 - 100
  exposure: number;
  maxPositionSize: number;
  portfolioExposureRatio: number;
  marginHealth: PositionHealthStatus;
  openPositionRisk: number;
  leverageRisk: number;
  alerts: RiskAlert[];
}

export interface RiskAlert {
  id: string;
  timestamp: string;
  severity: "info" | "warning" | "danger" | "critical";
  category: "leverage" | "margin" | "liquidation" | "funding" | "exposure" | "loss";
  title: string;
  message: string;
  marketSymbol?: string;
}

export interface OrderRiskValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number;
  requiredMargin: number;
  projectedMarginRatio: number;
  liquidationDistance: number;
}
