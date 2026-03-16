"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PricePoint = {
  id: number;
  price_usd: number;
  fetched_at: string;
};

type ChartPoint = {
  time: string;
  price: number;
  fullTime: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 px-3 py-2 text-xs shadow-sm">
        <p className="text-gray-500 mb-1">{label}</p>
        <p className="font-medium text-black">
          ${payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function GoldPriceChart() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const prices: PricePoint[] = json.prices ?? [];
      const chartPoints: ChartPoint[] = prices.map((p) => ({
        time: formatTime(p.fetched_at),
        fullTime: formatDateTime(p.fetched_at),
        price: p.price_usd,
      }));
      setData(chartPoints);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to load price data. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const currentPrice = data.length > 0 ? data[data.length - 1].price : null;
  const previousPrice = data.length > 1 ? data[data.length - 2].price : null;
  const changePercent =
    currentPrice && previousPrice
      ? ((currentPrice - previousPrice) / previousPrice) * 100
      : null;
  const isUp = changePercent !== null && changePercent >= 0;

  const allPrices = data.map((d) => d.price);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
  const pricePadding = (maxPrice - minPrice) * 0.1 || 10;

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-xs tracking-widest uppercase text-gray-400 animate-pulse">
          Loading chart…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <p className="text-xs tracking-wide text-red-500">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-gray-400">
          No price data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Price summary */}
      <div className="flex items-end gap-4 mb-8">
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">
            XAU / USD per Troy Oz
          </p>
          <p className="text-4xl sm:text-5xl font-light tracking-tight text-black">
            {currentPrice !== null
              ? `$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </p>
        </div>
        {changePercent !== null && (
          <div className={`mb-1 ${isUp ? "text-green-600" : "text-red-600"}`}>
            <p className="text-sm font-medium tracking-wide">
              {isUp ? "↑" : "↓"} {isUp ? "+" : ""}
              {changePercent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 tracking-wide">vs prev hour</p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="fullTime"
              tick={{ fontSize: 10, fill: "#aaa" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              domain={[minPrice - pricePadding, maxPrice + pricePadding]}
              tick={{ fontSize: 10, fill: "#aaa" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#000"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#000" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="mt-4 text-xs text-gray-400 tracking-wide">
          Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          &nbsp;· Auto-refreshes every 5 min
        </p>
      )}
    </div>
  );
}
