"use client";

import { useMarketEngine } from "./useMarketEngine";

export function useMarket() {
  const engine = useMarketEngine();

  return {
    ...engine,
    data: engine.overview,
    isLoading: engine.isLoading,
    refetch: engine.refresh,
  };
}
