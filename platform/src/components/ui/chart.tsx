"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer } from "recharts";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color?: string;
  }
>;

const ChartContext = React.createContext<ChartConfig | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used inside a ChartContainer");
  }

  return context;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
}) {
  const colorVars = Object.entries(config).reduce((acc, [key, value]) => {
    if (value.color) {
      acc[`--color-${key}`] = value.color;
    }
    return acc;
  }, {} as Record<string, string>);

  return (
    <ChartContext.Provider value={config}>
      <div
        className={cn("h-70 w-full", className)}
        style={colorVars as React.CSSProperties}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  className,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; color?: string; name?: string }>;
  label?: string;
  className?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-100 shadow-lg",
        className,
      )}
    >
      {label ? <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div key={`${item.dataKey}-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || "#22d3ee" }}
              />
              <span>{item.name || item.dataKey}</span>
            </div>
            <span className="font-semibold text-slate-100">{item.value ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
