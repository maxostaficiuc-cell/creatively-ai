"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { t: string } & Record<string, number | string>;

export function TrendChart({ data, series, hourly, height = 220 }: { data: Point[]; series: { key: string; label: string; color: string }[]; hourly: boolean; height?: number }) {
  const label = (t: string) => {
    const d = new Date(t);
    return hourly
      ? d.toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
  };
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="t" tickFormatter={label} tick={{ fill: "#6B6B75", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fill: "#6B6B75", fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))} />
          <Tooltip
            cursor={{ stroke: "rgba(167,139,250,0.35)" }}
            contentStyle={{ background: "#111116", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: "#9A9AA5" }}
            labelFormatter={(t) => `${label(String(t))}${hourly ? " UTC" : ""}`}
            formatter={(v: number, k: string) => [Number(v).toLocaleString("en-US"), series.find((s) => s.key === k)?.label ?? k]}
          />
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={1.75} fill={`url(#g-${s.key})`} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
