import type { Coin } from "@/types";

const BASE_URL = "https://api.coingecko.com/api/v3";

// CoinGecko IDs for the coins listed in the spec.
export const TRACKED_COINS = [
  "bitcoin",
  "ethereum",
  "tether",
  "usd-coin",
  "arbitrum",
  "solana",
  "chainlink",
  "uniswap",
  "dogecoin",
  "avalanche-2",
] as const;

export async function fetchMarketData(vsCurrency = "usd"): Promise<Coin[]> {
  const ids = TRACKED_COINS.join(",");
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
  );
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`);
  return res.json();
}

export async function fetchCoinDetail(id: string) {
  const res = await fetch(
    `${BASE_URL}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`
  );
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`);
  return res.json();
}

export async function fetchCoinMarketChart(id: string, days: number | "max" = 7, vsCurrency = "usd") {
  const res = await fetch(
    `${BASE_URL}/coins/${id}/market_chart?vs_currency=${vsCurrency}&days=${days}`
  );
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`);
  return res.json() as Promise<{ prices: [number, number][] }>;
}
