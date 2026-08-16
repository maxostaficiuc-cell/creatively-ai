"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Info } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";

const ranges = ["7D", "14D", "30D", "90D"] as const;

export function PerformanceChart({ data }: { data: { date: string; spend: number; revenue: number; roas: number }[] | null }) {
  const [range, setRange] = useState<(typeof ranges)[number]>("30D");

  return (
    <div className="rounded-2xl border border-base-border bg-base-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="font-medium text-ink-primary">Performance Overview</h3>
          <Info size={14} className="text-ink-muted" />
        </div>
        <div className="flex gap-1 rounded-lg border border-base-border bg-base-surface p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                range === r ? "bg-base-card text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-5 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand" /> Spend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-green" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-light" /> ROAS
        </span>
      </div>

      {!data || data.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<BarChart3 size={20} />}
            title="No performance data yet"
            description="Connect an ad account to see spend, revenue and ROAS trends here."
          />
        </div>
      ) : (
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#242429" vertical={false} />
              <XAxis dataKey="date" stroke="#6B6B75" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B6B75" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#15151A",
                  border: "1px solid #242429",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="spend" stroke="#8B5CF6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#22C55E" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="roas" stroke="#A78BFA" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
