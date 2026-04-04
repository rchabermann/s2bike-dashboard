"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DemographicRow } from "@/lib/sheets";

const GENDER_LABELS: Record<string, string> = {
  female: "Feminino",
  male: "Masculino",
  unknown: "Desconhecido",
};

const GENDER_COLORS: Record<string, string> = {
  female: "#f97316",
  male: "#4f8ef7",
  unknown: "#7a94b0",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1623", border: "1px solid #2a3f5a", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#7a94b0", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontFamily: "DM Mono, monospace" }}>
          {p.name}: {p.value.toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
};

export function DemographicsChart({ data }: { data: DemographicRow[] }) {
  if (!data.length) return null;

  // Collect age ranges and genders
  const ageRanges = Array.from(new Set(data.map((r) => r.ageRange))).sort();
  const genders = Array.from(new Set(data.map((r) => r.gender))).filter(
    (g) => g !== "unknown"
  );

  // Group: ageRange → { gender: results }
  const grouped: Record<string, Record<string, number>> = {};
  for (const row of data) {
    if (!grouped[row.ageRange]) grouped[row.ageRange] = {};
    grouped[row.ageRange][row.gender] =
      (grouped[row.ageRange][row.gender] ?? 0) + row.results;
  }

  const chartData = ageRanges.map((age) => ({
    age,
    ...Object.fromEntries(
      genders.map((g) => [GENDER_LABELS[g] ?? g, grouped[age]?.[g] ?? 0])
    ),
  }));

  return (
    <div className="card p-6 animate-in stagger-8">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>
        Resultados por Idade &amp; Gênero
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
          <XAxis dataKey="age" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={{ stroke: "#1e2d42" }} tickLine={false} />
          <YAxis tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "#7a94b0", paddingTop: 12 }} />
          {genders.map((g) => (
            <Bar
              key={g}
              dataKey={GENDER_LABELS[g] ?? g}
              fill={GENDER_COLORS[g] ?? "#7a94b0"}
              opacity={0.85}
              radius={[3, 3, 0, 0]}
              maxBarSize={30}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
