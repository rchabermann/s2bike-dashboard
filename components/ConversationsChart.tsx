"use client";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DailyMetrics } from "@/lib/sheets";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1623", border: "1px solid #2a3f5a", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#7a94b0", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontFamily: "DM Mono, monospace" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("pt-BR", { minimumFractionDigits: p.dataKey === "frequency" ? 2 : 0, maximumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  );
};

export function ConversationsChart({ data }: { data: DailyMetrics[] }) {
  const formatted = data.map((d) => ({
    ...d,
    dayFmt: (() => { try { return format(parseISO(d.day), "dd/MM", { locale: ptBR }); } catch { return d.day; } })(),
  }));
  return (
    <div className="card p-6 animate-in stagger-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>
        Alcance &amp; Frequência por Dia
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
          <XAxis dataKey="dayFmt" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={{ stroke: "#1e2d42" }} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="left" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(1)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "#7a94b0", paddingTop: 12 }} />
          <Area yAxisId="left" type="monotone" dataKey="reach" name="Alcance" stroke="#a78bfa" strokeWidth={2} fill="url(#colorReach)" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="frequency" name="Frequência" stroke="#2dd4bf" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
