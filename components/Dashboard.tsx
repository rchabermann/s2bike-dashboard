"use client";

import { useState, useMemo } from "react";
import { DashboardData, DailyMetrics, AdPerformance } from "@/lib/sheets";
import { KPICard } from "@/components/KPICard";
import { SpendChart } from "@/components/SpendChart";
import { ConversationsChart } from "@/components/ConversationsChart";
import { AdPerformanceTable } from "@/components/AdPerformanceTable";
import { CPMChart } from "@/components/CPMChart";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  try { return format(parseISO(dateStr), "dd 'de' MMM", { locale: ptBR }); }
  catch { return dateStr; }
}

function fmtLastUpdated(iso: string) {
  try { return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
  catch { return iso; }
}

interface Props {
  data: DashboardData;
}

export function Dashboard({ data }: Props) {
  const { rows, daily, byAd, dateRange, lastUpdated } = data;

  // --- Filter state ---
  const [startDate, setStartDate] = useState(dateRange.start);
  const [endDate, setEndDate] = useState(dateRange.end);
  const [selectedAds, setSelectedAds] = useState<string[]>([]);

  const adNames = useMemo(() => Array.from(new Set(rows.map((r) => r.adName))).sort(), [rows]);

  const toggleAd = (name: string) => {
    setSelectedAds((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const clearFilters = () => {
    setStartDate(dateRange.start);
    setEndDate(dateRange.end);
    setSelectedAds([]);
  };

  const hasActiveFilters =
    startDate !== dateRange.start || endDate !== dateRange.end || selectedAds.length > 0;

  // --- Filtered data ---
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const inDateRange = r.day >= startDate && r.day <= endDate;
      const inAds = selectedAds.length === 0 || selectedAds.includes(r.adName);
      return inDateRange && inAds;
    });
  }, [rows, startDate, endDate, selectedAds]);

  const filteredDaily = useMemo((): DailyMetrics[] => {
    const dayMap = new Map<string, DailyMetrics>();
    for (const row of filteredRows) {
      const d = dayMap.get(row.day);
      if (d) {
        d.amountSpent += row.amountSpent;
        d.impressions += row.impressions;
        d.reach += row.reach;
        d.linkClicks += row.linkClicks;
        d.messagingConversations += row.messagingConversations;
      } else {
        dayMap.set(row.day, {
          day: row.day,
          amountSpent: row.amountSpent,
          impressions: row.impressions,
          reach: row.reach,
          linkClicks: row.linkClicks,
          messagingConversations: row.messagingConversations,
          cpm: 0, ctr: 0, cpc: 0,
        });
      }
    }
    return Array.from(dayMap.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((d) => ({
        ...d,
        cpm: d.impressions > 0 ? (d.amountSpent / d.impressions) * 1000 : 0,
        ctr: d.impressions > 0 ? (d.linkClicks / d.impressions) * 100 : 0,
        cpc: d.linkClicks > 0 ? d.amountSpent / d.linkClicks : 0,
      }));
  }, [filteredRows]);

  const filteredByAd = useMemo((): AdPerformance[] => {
    const adMap = new Map<string, AdPerformance>();
    for (const row of filteredRows) {
      const a = adMap.get(row.adName);
      if (a) {
        a.amountSpent += row.amountSpent;
        a.impressions += row.impressions;
        a.reach += row.reach;
        a.linkClicks += row.linkClicks;
        a.messagingConversations += row.messagingConversations;
      } else {
        adMap.set(row.adName, {
          adName: row.adName,
          amountSpent: row.amountSpent,
          impressions: row.impressions,
          reach: row.reach,
          linkClicks: row.linkClicks,
          messagingConversations: row.messagingConversations,
          avgCpc: 0, avgCpm: 0, avgCtr: 0,
        });
      }
    }
    return Array.from(adMap.values())
      .map((a) => ({
        ...a,
        avgCpm: a.impressions > 0 ? (a.amountSpent / a.impressions) * 1000 : 0,
        avgCtr: a.impressions > 0 ? (a.linkClicks / a.impressions) * 100 : 0,
        avgCpc: a.linkClicks > 0 ? a.amountSpent / a.linkClicks : 0,
      }))
      .sort((a, b) => b.amountSpent - a.amountSpent);
  }, [filteredRows]);

  const totals = useMemo(() => {
    const totalSpent = filteredRows.reduce((s, r) => s + r.amountSpent, 0);
    const totalImpressions = filteredRows.reduce((s, r) => s + r.impressions, 0);
    const totalReach = filteredDaily.reduce((s, d) => s + d.reach, 0);
    const totalClicks = filteredRows.reduce((s, r) => s + r.linkClicks, 0);
    const totalConversations = filteredRows.reduce((s, r) => s + r.messagingConversations, 0);
    return {
      amountSpent: totalSpent,
      impressions: totalImpressions,
      reach: totalReach,
      linkClicks: totalClicks,
      messagingConversations: totalConversations,
      avgCpm: totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0,
      avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
    };
  }, [filteredRows, filteredDaily]);

  const AD_COLORS: Record<string, string> = {
    "Racevox Evo": "#4f8ef7",
    "Racevox Evo 2": "#a78bfa",
    "Bike Elétrica - Gavaia e Bruno": "#f97316",
    "Exalt E-trail": "#22c55e",
  };

  return (
    <main className="min-h-screen grid-bg" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              🚴
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>S2 Bike</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Meta Ads · [RCH] Campanha WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Período total</p>
              <p className="mono text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {fmtDate(dateRange.start)} → {fmtDate(dateRange.end)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Atualizado</p>
              <p className="mono text-xs" style={{ color: "var(--accent-green)" }}>
                {fmtLastUpdated(lastUpdated)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── FILTERS ── */}
        <section className="card p-5 animate-in stagger-1">
          <div className="flex flex-wrap items-end gap-6">
            {/* Date range */}
            <div className="flex items-end gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>De</p>
                <input
                  type="date"
                  value={startDate}
                  min={dateRange.start}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mono text-sm px-3 py-2 rounded-lg outline-none"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border-bright)",
                    color: "var(--text-primary)",
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Até</p>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={dateRange.end}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mono text-sm px-3 py-2 rounded-lg outline-none"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border-bright)",
                    color: "var(--text-primary)",
                    colorScheme: "dark",
                  }}
                />
              </div>
            </div>

            {/* Ad filter */}
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Anúncios</p>
              <div className="flex flex-wrap gap-2">
                {adNames.map((name) => {
                  const active = selectedAds.includes(name);
                  const color = AD_COLORS[name] ?? "#7a94b0";
                  return (
                    <button
                      key={name}
                      onClick={() => toggleAd(name)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        border: `1px solid ${active ? color : "var(--border-bright)"}`,
                        background: active ? `${color}22` : "transparent",
                        color: active ? color : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs px-3 py-2 rounded-lg transition-all"
                style={{
                  border: "1px solid var(--border-bright)",
                  color: "var(--text-muted)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Limpar filtros ×
              </button>
            )}
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <p className="mono text-xs mt-3" style={{ color: "var(--accent-blue)" }}>
              Exibindo: {fmtDate(startDate)} → {fmtDate(endDate)}
              {selectedAds.length > 0 && ` · ${selectedAds.join(", ")}`}
              {" "}· {filteredRows.length} linha{filteredRows.length !== 1 ? "s" : ""}
            </p>
          )}
        </section>

        {/* KPI Grid */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
            Resumo do Período
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPICard label="Total Investido" value={`R$ ${fmtBRL(totals.amountSpent)}`} icon="💸" accentColor="var(--accent-orange)" stagger={2} />
            <KPICard label="Impressões" value={totals.impressions.toLocaleString("pt-BR")} icon="👁️" accentColor="var(--accent-blue)" stagger={3} />
            <KPICard label="Alcance" value={totals.reach.toLocaleString("pt-BR")} icon="📡" accentColor="var(--accent-purple)" stagger={4} />
            <KPICard label="Cliques no Link" value={totals.linkClicks.toLocaleString("pt-BR")} subvalue={`CTR médio: ${totals.avgCtr.toFixed(2)}%`} icon="🖱️" accentColor="var(--accent-teal)" stagger={5} />
            <KPICard label="Conversas WhatsApp" value={totals.messagingConversations.toLocaleString("pt-BR")} icon="💬" accentColor="var(--accent-green)" stagger={5} />
            <KPICard label="CPM Médio" value={`R$ ${fmtBRL(totals.avgCpm)}`} icon="📊" accentColor="var(--accent-purple)" stagger={6} />
            <KPICard label="CPC Médio" value={totals.avgCpc > 0 ? `R$ ${fmtBRL(totals.avgCpc)}` : "—"} icon="🎯" accentColor="var(--accent-teal)" stagger={7} />
            <KPICard label="Anúncios" value={String(filteredByAd.length)} icon="📣" accentColor="var(--accent-orange)" stagger={8} />
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpendChart data={filteredDaily} />
          <ConversationsChart data={filteredDaily} />
        </section>
        <section>
          <CPMChart data={filteredDaily} />
        </section>
        <section>
          <AdPerformanceTable data={filteredByAd} totalSpent={totals.amountSpent} />
        </section>

        <footer className="text-center pb-8">
          <p className="mono text-xs" style={{ color: "var(--text-muted)" }}>
            Dados via Google Sheets · Atualização automática diária · S2 Bike {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </main>
  );
}
