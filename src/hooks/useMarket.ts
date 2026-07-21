import { useQuery } from "@tanstack/react-query";
import { fetchMarketData } from "@/lib/coingecko";

export function useMarket(vsCurrency = "usd") {
  return useQuery({
    queryKey: ["market", vsCurrency],
    queryFn: () => fetchMarketData(vsCurrency),
    refetchInterval: 30_000,
  });
}
