"use client";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
          {p.name}: {p.dataKey === "cpl" ? `R$ ${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
};

export function CPMChart({ data }: { data: DailyMetrics[] }) {
  const formatted = data.map((d) => ({
    ...d,
    cpl: d.messagingConversations > 0 ? parseFloat((d.amountSpent / d.messagingConversations).toFixed(2)) : 0,
    dayFmt: (() => { try { return format(parseISO(d.day), "dd/MM", { locale: ptBR }); } catch { return d.day; } })(),
  }));
  return (
    <div className="card p-6 animate-in stagger-7">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>
        Conversas Iniciadas &amp; CPL por Dia
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
          <XAxis dataKey="dayFmt" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={{ stroke: "#1e2d42" }} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="left" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "#7a94b0", paddingTop: 12 }} />
          <Bar yAxisId="left" dataKey="messagingConversations" name="Conversas iniciadas" fill="#22c55e" opacity={0.85} radius={[3,3,0,0]} maxBarSize={28} />
          <Line yAxisId="right" type="monotone" dataKey="cpl" name="CPL (R$)" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
