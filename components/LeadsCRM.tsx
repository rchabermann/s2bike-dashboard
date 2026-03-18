"use client";
import { useState, useMemo } from "react";
import { LeadRow } from "@/lib/leads";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type CRMTab = "funil" | "vendas" | "lista";

export function LeadsCRM({ leads }: { leads: LeadRow[] }) {
  const [crmTab, setCrmTab] = useState<CRMTab>("funil");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [potentialFilter, setPotentialFilter] = useState<string[]>([]);

  const allStatuses = useMemo(() => Array.from(new Set(leads.map(l => l.status).filter(Boolean))).sort(), [leads]);

  const toggleFilter = (val: string, arr: string[], setArr: (v: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.toLowerCase().includes(q) || l.bikeInterest.toLowerCase().includes(q) || l.notes.toLowerCase().includes(q);
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(l.status);
      const matchPotential = potentialFilter.length === 0 || potentialFilter.includes(l.potential);
      return matchSearch && matchStatus && matchPotential;
    });
  }, [leads, search, statusFilter, potentialFilter]);

  // Sales metrics
  const salesLeads = useMemo(() => leads.filter(l => l.status === "Venda"), [leads]);
  const totalRevenue = useMemo(() => salesLeads.reduce((s, l) => s + l.saleValue, 0), [salesLeads]);
  const avgTicket = salesLeads.length > 0 ? totalRevenue / salesLeads.filter(l => l.saleValue > 0).length : 0;
  const convRate = leads.length > 0 ? (salesLeads.length / leads.length * 100) : 0;

  // Sales by bike
  const salesByBike = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const l of salesLeads) {
      const key = l.bikeInterest || "Sem descrição";
      const existing = map.get(key);
      if (existing) { existing.count++; existing.revenue += l.saleValue; }
      else map.set(key, { count: 1, revenue: l.saleValue });
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [salesLeads]);

  // Funil
  const funilData = [
    { label: "Total de Leads", value: leads.length, color: "#4f8ef7" },
    { label: "Quentes", value: leads.filter(l => l.potential === "Quente").length, color: "#ef4444" },
    { label: "Negociando", value: leads.filter(l => l.status === "Negociando").length, color: "#f97316" },
    { label: "Vendas", value: salesLeads.length, color: "#22c55e" },
  ];

  const CRMTabs: [CRMTab, string][] = [["funil", "Funil"], ["vendas", "Vendas"], ["lista", "Lista"]];

  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>CRM — Controle de Leads</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total de Leads", value: leads.length, color: "var(--accent-blue)", icon: "👥" },
          { label: "Vendas Realizadas", value: salesLeads.length, color: "#22c55e", icon: "✅" },
          { label: "Receita Total", value: totalRevenue > 0 ? `R$ ${fmtBRL(totalRevenue)}` : "—", color: "var(--accent-green)", icon: "💰" },
          { label: "Ticket Médio", value: avgTicket > 0 ? `R$ ${fmtBRL(avgTicket)}` : "—", color: "var(--accent-purple)", icon: "🎯" },
        ].map((k) => (
          <div key={k.label} className="card p-4 relative overflow-hidden animate-in stagger-1">
            <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-10 blur-xl" style={{ backgroundColor: k.color }} />
            <div className="flex items-start justify-between mb-2">
              <span style={{ fontSize: 16 }}>{k.icon}</span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: k.color }} />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>{k.label}</p>
            <p className="mono text-xl font-medium" style={{ color: k.color }}>{typeof k.value === "number" ? k.value : k.value}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {CRMTabs.map(([tab, label]) => (
          <button key={tab} onClick={() => setCrmTab(tab)}
            className="text-sm font-medium px-4 py-2 border-b-2 transition-colors"
            style={{ borderColor: crmTab === tab ? "var(--accent-blue)" : "transparent", color: crmTab === tab ? "var(--accent-blue)" : "var(--text-muted)", background: "transparent", cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {/* FUNIL */}
      {crmTab === "funil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Visual funnel */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>Funil de Conversão</h3>
            <div className="space-y-3">
              {funilData.map((item, i) => {
                const pct = funilData[0].value > 0 ? (item.value / funilData[0].value) * 100 : 0;
                const width = 100 - i * 12;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>{pct.toFixed(1)}%</span>
                        <span className="mono text-sm font-medium" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="h-8 rounded-md flex items-center justify-center transition-all"
                        style={{ width: `${width}%`, background: `${item.color}33`, border: `1px solid ${item.color}66` }}>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Taxa de conversão geral</span>
                <span className="mono text-sm font-medium" style={{ color: "#22c55e" }}>{convRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>Status dos Leads</h3>
            <div className="space-y-3">
              {allStatuses.map(status => {
                const count = leads.filter(l => l.status === status).length;
                const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
                const color = STATUS_COLORS[status] ?? "#7a94b0";
                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{status}</span>
                      <div className="flex items-center gap-3">
                        <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>{pct.toFixed(1)}%</span>
                        <span className="mono text-sm font-medium" style={{ color }}>{count}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full w-full" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VENDAS */}
      {crmTab === "vendas" && (
        <div className="space-y-4">
          {salesByBike.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>Vendas por Produto</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={salesByBike} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#3d5470", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#7a94b0", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip formatter={(v: any) => [v, "Vendas"]} contentStyle={{ background: "#0f1623", border: "1px solid #2a3f5a", borderRadius: 8, fontFamily: "DM Mono, monospace", fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {salesByBike.map((_, i) => (
                      <Cell key={i} fill={["#22c55e", "#4f8ef7", "#a78bfa", "#f97316", "#2dd4bf", "#ef4444", "#f97316", "#22c55e"][i % 8]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sales list */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Data", "Cliente", "Produto", "Potencial", "Valor"].map(h => (
                    <th key={h} className="mono text-left py-3 px-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salesLeads.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center" style={{ color: "var(--text-muted)" }}>Nenhuma venda registrada</td></tr>
                ) : salesLeads.map((lead, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }} className="transition-colors hover:bg-[#141d2e]">
                    <td className="mono py-3 px-4 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(lead.date)}</td>
                    <td className="py-3 px-4 font-medium" style={{ color: "var(--text-primary)" }}>{lead.name}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: "var(--text-secondary)" }}>{lead.bikeInterest}</td>
                    <td className="py-3 px-4">
                      <span className="mono text-xs px-2 py-1 rounded-full" style={{ background: `${POTENTIAL_COLORS[lead.potential] ?? "#3d5470"}22`, color: POTENTIAL_COLORS[lead.potential] ?? "var(--text-muted)", border: `1px solid ${POTENTIAL_COLORS[lead.potential] ?? "#3d5470"}44` }}>
                        {lead.potential || "—"}
                      </span>
                    </td>
                    <td className="mono py-3 px-4 font-medium" style={{ color: "#22c55e" }}>
                      {lead.saleValue > 0 ? `R$ ${fmtBRL(lead.saleValue)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalRevenue > 0 && (
                <tfoot>
                  <tr style={{ borderTop: "1px solid var(--border-bright)" }}>
                    <td colSpan={4} className="mono py-3 px-4 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>Total</td>
                    <td className="mono py-3 px-4 font-medium" style={{ color: "#22c55e" }}>R$ {fmtBRL(totalRevenue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* LISTA */}
      {crmTab === "lista" && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Buscar</p>
                <input type="text" placeholder="Nome, telefone, bike..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }} />
              </div>
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
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Potencial</p>
                <div className="flex flex-wrap gap-2">
                  {["Quente", "Morno", "Frio"].map(p => {
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
            <p className="mono text-xs mt-3" style={{ color: "var(--accent-blue)" }}>{filtered.length} lead{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="card overflow-x-auto">
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
                      <span className="mono text-xs px-2 py-1 rounded-full" style={{ background: `${POTENTIAL_COLORS[lead.potential] ?? "#3d5470"}22`, color: POTENTIAL_COLORS[lead.potential] ?? "var(--text-muted)", border: `1px solid ${POTENTIAL_COLORS[lead.potential] ?? "#3d5470"}44` }}>{lead.potential || "—"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="mono text-xs px-2 py-1 rounded-full" style={{ background: `${STATUS_COLORS[lead.status] ?? "#3d5470"}22`, color: STATUS_COLORS[lead.status] ?? "var(--text-muted)", border: `1px solid ${STATUS_COLORS[lead.status] ?? "#3d5470"}44` }}>{lead.status || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-xs max-w-xs truncate" style={{ color: "var(--text-secondary)" }} title={lead.notes}>{lead.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
