"use client";
import { useState, useMemo } from "react";
import { LeadRow } from "@/lib/leads";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  "Venda": "#22c55e",
  "Negociando": "#f97316",
  "Encerrado": "#3d5470",
};
const POTENTIAL_COLORS: Record<string, string> = {
  "Quente": "#ef4444",
  "Morno": "#f97316",
  "Frio": "#4f8ef7",
};

function fmtDate(d: string) {
  try { return format(parseISO(d), "dd/MM/yy", { locale: ptBR }); } catch { return d; }
}

export function LeadsCRM({ leads }: { leads: LeadRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [potentialFilter, setPotentialFilter] = useState<string[]>([]);

  const allStatuses = useMemo(() => Array.from(new Set(leads.map(l => l.status).filter(Boolean))).sort(), [leads]);
  const allPotentials = useMemo(() => ["Quente", "Morno", "Frio"], []);

  const toggleFilter = (val: string, arr: string[], setArr: (v: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchSearch = !q ||
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.bikeInterest.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q);
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(l.status);
      const matchPotential = potentialFilter.length === 0 || potentialFilter.includes(l.potential);
      return matchSearch && matchStatus && matchPotential;
    });
  }, [leads, search, statusFilter, potentialFilter]);

  const totals = useMemo(() => ({
    total: filtered.length,
    vendas: filtered.filter(l => l.status === "Venda").length,
    negociando: filtered.filter(l => l.status === "Negociando").length,
    quentes: filtered.filter(l => l.potential === "Quente").length,
    taxa: filtered.length > 0 ? ((filtered.filter(l => l.status === "Venda").length / filtered.length) * 100).toFixed(1) : "0.0",
  }), [filtered]);

  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        CRM — Controle de Leads
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total de Leads", value: totals.total, color: "var(--accent-blue)" },
          { label: "Vendas", value: totals.vendas, color: "#22c55e" },
          { label: "Negociando", value: totals.negociando, color: "var(--accent-orange)" },
          { label: "Taxa de Conversão", value: `${totals.taxa}%`, color: "var(--accent-purple)" },
        ].map((k) => (
          <div key={k.label} className="card p-4 relative overflow-hidden animate-in stagger-1">
            <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-10 blur-xl" style={{ backgroundColor: k.color }} />
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>{k.label}</p>
            <p className="mono text-2xl font-medium" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-5 animate-in stagger-2">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Buscar</p>
            <input
              type="text"
              placeholder="Nome, telefone, bike..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Status</p>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map(s => {
                const active = statusFilter.includes(s);
                const color = STATUS_COLORS[s] ?? "#7a94b0";
                return (
                  <button key={s} onClick={() => toggleFilter(s, statusFilter, setStatusFilter)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ border: `1px solid ${active ? color : "var(--border-bright)"}`, background: active ? `${color}22` : "transparent", color: active ? color : "var(--text-secondary)", cursor: "pointer" }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Potencial */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Potencial</p>
            <div className="flex flex-wrap gap-2">
              {allPotentials.map(p => {
                const active = potentialFilter.includes(p);
                const color = POTENTIAL_COLORS[p] ?? "#7a94b0";
                return (
                  <button key={p} onClick={() => toggleFilter(p, potentialFilter, setPotentialFilter)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ border: `1px solid ${active ? color : "var(--border-bright)"}`, background: active ? `${color}22` : "transparent", color: active ? color : "var(--text-secondary)", cursor: "pointer" }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {(search || statusFilter.length > 0 || potentialFilter.length > 0) && (
            <button onClick={() => { setSearch(""); setStatusFilter([]); setPotentialFilter([]); }}
              className="text-xs px-3 py-2 rounded-lg"
              style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)", background: "transparent", cursor: "pointer" }}>
              Limpar ×
            </button>
          )}
        </div>
        <p className="mono text-xs mt-3" style={{ color: "var(--accent-blue)" }}>
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="card animate-in stagger-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Data", "Nome", "Telefone", "Bike", "Potencial", "Status", "Atualizações"].map(h => (
                <th key={h} className="mono text-left py-3 px-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center" style={{ color: "var(--text-muted)" }}>Nenhum lead encontrado</td></tr>
            ) : filtered.map((lead, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }} className="transition-colors hover:bg-[#141d2e]">
                <td className="mono py-3 px-4 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(lead.date)}</td>
                <td className="py-3 px-4 font-medium" style={{ color: "var(--text-primary)" }}>{lead.name}</td>
                <td className="mono py-3 px-4 text-xs" style={{ color: "var(--text-secondary)" }}>{lead.phone}</td>
                <td className="py-3 px-4 text-xs" style={{ color: "var(--text-secondary)" }}>{lead.bikeInterest}</td>
                <td className="py-3 px-4">
                  <span className="mono text-xs px-2 py-1 rounded-full" style={{
                    background: `${POTENTIAL_COLORS[lead.potential] ?? "#3d5470"}22`,
                    color: POTENTIAL_COLORS[lead.potential] ?? "var(--text-muted)",
                    border: `1px solid ${POTENTIAL_COLORS[lead.potential] ?? "#3d5470"}44`
                  }}>{lead.potential || "—"}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="mono text-xs px-2 py-1 rounded-full" style={{
                    background: `${STATUS_COLORS[lead.status] ?? "#3d5470"}22`,
                    color: STATUS_COLORS[lead.status] ?? "var(--text-muted)",
                    border: `1px solid ${STATUS_COLORS[lead.status] ?? "#3d5470"}44`
                  }}>{lead.status || "—"}</span>
                </td>
                <td className="py-3 px-4 text-xs max-w-xs truncate" style={{ color: "var(--text-secondary)" }} title={lead.notes}>{lead.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
