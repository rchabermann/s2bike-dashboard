"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PlacementRow } from "@/lib/sheets";

const PLACEMENT_LABELS: Record<string, string> = {
  feed: "Feed",
  instagram_reels: "Reels",
  instagram_stories: "Stories",
  instagram_explore: "Explore",
  audience_network_classic: "Audience Net.",
  facebook_reels: "FB Reels",
};

function labelPlacement(p: string) {
  return PLACEMENT_LABELS[p] ?? p.replace(/_/g, " ");
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1623", border: "1px solid #2a3f5a", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#7a94b0", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontFamily: "DM Mono, monospace" }}>
          {p.name}: {p.dataKey === "amountSpent" ? `R$ ${fmt(p.value)}` : p.value.toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
};

export function PlacementsChart({ data }: { data: PlacementRow[] }) {
  if (!data.length) return null;

  const grouped = new Map<string, PlacementRow>();
  for (const row of data) {
    const key = row.placement || row.platform;
    const existing = grouped.get(key);
    if (existing) {
      existing.amountSpent += row.amountSpent;
      existing.impressions += row.impressions;
      existing.results += row.results;
      existing.waConversations += row.waConversations;
      existing.videoViews3s += row.videoViews3s;
    } else {
      grouped.set(key, { ...row });
    }
  }

  const chartData = Array.from(grouped.values())
    .map((r) => ({
      name: labelPlacement(r.placement || r.platform),
      "Investimento": r.amountSpent,
      "Resultados": r.results,
      "Conversas WA": r.waConversations,
      "Videoviews": r.videoViews3s,
    }))
    .sort((a, b) => b["Investimento"] - a["Investimento"]);

  return (
    <div className="card p-6 animate-in stagger-7">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>
        Performance por Posicionamento
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={{ stroke: "#1e2d42" }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "#7a94b0", paddingTop: 12 }} />
          <Bar yAxisId="left" dataKey="Resultados" fill="#4f8ef7" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={40} />
          <Bar yAxisId="right" dataKey="Conversas WA" fill="#22c55e" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
