"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChartTimeframe, OHLCVPoint } from "@/types/market";
import { ChartEngineService } from "@/services/chart-engine.service";
import { Loader2, TrendingUp, BarChart2, LineChart as LineIcon } from "lucide-react";

interface MarketChartProps {
  tokenId: string;
  symbol: string;
  timeframe?: ChartTimeframe;
  onTimeframeChange?: (tf: ChartTimeframe) => void;
  height?: number;
}

export const MarketChart: React.FC<MarketChartProps> = ({
  tokenId,
  symbol,
  timeframe = "1D",
  onTimeframeChange,
  height = 360,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");
  const [points, setPoints] = useState<OHLCVPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<OHLCVPoint | null>(null);

  const timeframes: ChartTimeframe[] = ["1H", "4H", "1D", "1W", "1M", "3M", "1Y", "ALL"];

  // Fetch Chart Series
  useEffect(() => {
    let active = true;
    setLoading(true);

    ChartEngineService.getChartSeries(tokenId, timeframe)
      .then((series) => {
        if (!active) return;
        setPoints(series.points);
        if (series.points.length > 0) {
          setSelectedPoint(series.points[series.points.length - 1]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tokenId, timeframe]);

  // Render TradingView Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current || points.length === 0 || loading) return;

    let chart: any = null;

    const renderChart = async () => {
      try {
        const { createChart, ColorType } = await import("lightweight-charts");
        if (!chartContainerRef.current) return;

        chartContainerRef.current.innerHTML = "";

        chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: height,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#9CA3AF",
          },
          grid: {
            vertLines: { color: "rgba(255, 255, 255, 0.05)" },
            horzLines: { color: "rgba(255, 255, 255, 0.05)" },
          },
          timeScale: {
            borderColor: "rgba(255, 255, 255, 0.1)",
            timeVisible: true,
          },
          rightPriceScale: {
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
        });

        // Volume series
        const volumeSeries = chart.addHistogramSeries({
          color: "#26a69a",
          priceFormat: { type: "volume" },
          priceScaleId: "",
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        volumeSeries.setData(ChartEngineService.formatForLightweightVolume(points));

        if (chartType === "candlestick") {
          const mainSeries = chart.addCandlestickSeries({
            upColor: "#10B981",
            downColor: "#EF4444",
            borderVisible: false,
            wickUpColor: "#10B981",
            wickDownColor: "#EF4444",
          });
          mainSeries.setData(ChartEngineService.formatForLightweightCandlestick(points));
        } else {
          const lineSeries = chart.addLineSeries({
            color: "#6366F1",
            lineWidth: 2,
          });
          lineSeries.setData(ChartEngineService.formatForLightweightLine(points));
        }

        chart.timeScale().fitContent();

        // Resize handler
        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      } catch (err) {
        console.warn("Lightweight charts fallback to SVG canvas", err);
      }
    };

    renderChart();

    return () => {
      if (chart) {
        chart.remove();
      }
    };
  }, [points, chartType, loading, height]);

  const activePoint = selectedPoint || (points.length > 0 ? points[points.length - 1] : null);

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col gap-4">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">${symbol} Chart</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Feed
            </span>
          </div>
          {activePoint && (
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
              <span>O: <strong className="text-white">${activePoint.open.toFixed(2)}</strong></span>
              <span>H: <strong className="text-emerald-400">${activePoint.high.toFixed(2)}</strong></span>
              <span>L: <strong className="text-rose-400">${activePoint.low.toFixed(2)}</strong></span>
              <span>C: <strong className="text-white">${activePoint.close.toFixed(2)}</strong></span>
            </div>
          )}
        </div>

        {/* Chart Type Toggle & Timeframes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-800/80 p-1 rounded-lg border border-neutral-700/50">
            <button
              onClick={() => setChartType("candlestick")}
              className={`p-1.5 rounded text-xs font-medium transition-colors ${
                chartType === "candlestick"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`p-1.5 rounded text-xs font-medium transition-colors ${
                chartType === "line"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Line Chart"
            >
              <LineIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-neutral-800/80 p-1 rounded-lg border border-neutral-700/50 overflow-x-auto">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange?.(tf)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  timeframe === tf
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full min-h-[300px]" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/80 backdrop-blur-sm z-10 rounded-lg">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            <span className="text-xs text-neutral-400">Loading Market Candles...</span>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
