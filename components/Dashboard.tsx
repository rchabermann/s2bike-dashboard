"use client";
import { useState, useMemo } from "react";
import { DashboardData, DailyMetrics, AdPerformance } from "@/lib/sheets";
import { LeadRow } from "@/lib/leads";
import { KPICard } from "@/components/KPICard";
import { SpendChart } from "@/components/SpendChart";
import { ConversationsChart } from "@/components/ConversationsChart";
import { AdPerformanceTable } from "@/components/AdPerformanceTable";
import { CPMChart } from "@/components/CPMChart";
import { PlacementsChart } from "@/components/PlacementsChart";
import { DemographicsChart } from "@/components/DemographicsChart";
import { LeadsCRM } from "@/components/LeadsCRM";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  try { return format(parseISO(d), "dd 'de' MMM", { locale: ptBR }); } catch { return d; }
}
function fmtLastUpdated(iso: string) {
  try { return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); } catch { return iso; }
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n: number) {
  return subDays(new Date(), n).toISOString().slice(0, 10);
}

const PRESET_RANGES = [
  { label: "7 dias", getValue: () => ({ start: daysAgoStr(7), end: todayStr() }) },
  { label: "14 dias", getValue: () => ({ start: daysAgoStr(14), end: todayStr() }) },
  { label: "30 dias", getValue: () => ({ start: daysAgoStr(30), end: todayStr() }) },
  { label: "Total", getValue: null },
];

const AD_COLORS: Record<string, string> = {
  "Racevox Evo": "#4f8ef7",
  "Racevox Evo 2": "#a78bfa",
  "Bike Elétrica - Gavaia e Bruno": "#f97316",
  "Exalt E-trail": "#22c55e",
};

type Tab = "ads" | "leads";

export function Dashboard({ data, leads, userRole, userName }: { data: DashboardData; leads: LeadRow[]; userRole: string; userName: string }) {
  const { rows, daily, byAd, dateRange, lastUpdated, summary, placements, demographics } = data;

  const [activeTab, setActiveTab] = useState<Tab>("ads");
  const isAdmin = userRole === "admin";
  const availableTabs: [Tab, string][] = [
    ["ads", "📊 Meta Ads"],
    ...(isAdmin ? [["leads", "👥 Leads"]] as [Tab, string][] : []),
  ];
  const [startDate, setStartDate] = useState(dateRange.start);
  const [endDate, setEndDate] = useState(dateRange.end);
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>("Total");

  const adNames = useMemo(() => Array.from(new Set(rows.map(r => r.adName))).sort(), [rows]);

  const applyPreset = (label: string, getValue: (() => { start: string; end: string }) | null) => {
    setActivePreset(label);
    if (getValue) {
      const { start, end } = getValue();
      setStartDate(start < dateRange.start ? dateRange.start : start);
      setEndDate(end);
    } else {
      setStartDate(dateRange.start);
      setEndDate(dateRange.end);
    }
  };

  const toggleAd = (name: string) => {
    setActivePreset(null);
    setSelectedAds(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  };

  const clearFilters = () => {
    setStartDate(dateRange.start);
    setEndDate(dateRange.end);
    setSelectedAds([]);
    setActivePreset("Total");
  };

  const hasActiveFilters = startDate !== dateRange.start || endDate !== dateRange.end || selectedAds.length > 0;

  const filteredRows = useMemo(() => rows.filter(r =>
    r.day >= startDate && r.day <= endDate &&
    (selectedAds.length === 0 || selectedAds.includes(r.adName))
  ), [rows, startDate, endDate, selectedAds]);

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
        d.videoViews3s += row.videoViews3s;
        d.thruPlay += row.thruPlay;
      } else {
        dayMap.set(row.day, {
          day: row.day,
          amountSpent: row.amountSpent,
          impressions: row.impressions,
          reach: row.reach,
          linkClicks: row.linkClicks,
          messagingConversations: row.messagingConversations,
          videoViews3s: row.videoViews3s,
          thruPlay: row.thruPlay,
          frequency: 0, cpm: 0, ctr: 0, cpc: 0,
        });
      }
    }
    return Array.from(dayMap.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map(d => ({
        ...d,
        frequency: d.reach > 0 ? d.impressions / d.reach : 0,
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
        a.reactions += row.reactions;
        a.comments += row.comments;
        a.shares += row.shares;
        a.videoViews3s += row.videoViews3s;
        a.thruPlay += row.thruPlay;
      } else {
        adMap.set(row.adName, {
          adName: row.adName,
          amountSpent: row.amountSpent,
          impressions: row.impressions,
          reach: row.reach,
          linkClicks: row.linkClicks,
          messagingConversations: row.messagingConversations,
          reactions: row.reactions,
          comments: row.comments,
          shares: row.shares,
          videoViews3s: row.videoViews3s,
          thruPlay: row.thruPlay,
          avgCpc: 0, avgCpm: 0, avgCtr: 0,
        });
      }
    }
    return Array.from(adMap.values())
      .map(a => ({
        ...a,
        avgCpm: a.impressions > 0 ? (a.amountSpent / a.impressions) * 1000 : 0,
        avgCtr: a.impressions > 0 ? (a.linkClicks / a.impressions) * 100 : 0,
        avgCpc: a.linkClicks > 0 ? a.amountSpent / a.linkClicks : 0,
      }))
      .sort((a, b) => b.amountSpent - a.amountSpent);
  }, [filteredRows]);

  // Alcance e frequência reais (da aba Resumo) para presets de 7/14/30 dias sem filtro de anúncio.
  // Somar alcance dia a dia gera número incorreto pois uma mesma pessoa pode aparecer em múltiplos dias.
  const summaryKey = activePreset === "7 dias" ? "7" : activePreset === "14 dias" ? "14" : activePreset === "30 dias" ? "30" : null;
  const useRealReach = summaryKey !== null && selectedAds.length === 0;

  const totals = useMemo(() => {
    const s = filteredRows.reduce((acc, r) => acc + r.amountSpent, 0);
    const imp = filteredRows.reduce((acc, r) => acc + r.impressions, 0);
    const clicks = filteredRows.reduce((acc, r) => acc + r.linkClicks, 0);
    const convs = filteredRows.reduce((acc, r) => acc + r.messagingConversations, 0);
    const videoViews = filteredRows.reduce((acc, r) => acc + r.videoViews3s, 0);
    const thruPlay = filteredRows.reduce((acc, r) => acc + r.thruPlay, 0);
    const reactions = filteredRows.reduce((acc, r) => acc + r.reactions, 0);
    const comments = filteredRows.reduce((acc, r) => acc + r.comments, 0);
    const shares = filteredRows.reduce((acc, r) => acc + r.shares, 0);

    const reach = useRealReach && summaryKey
      ? summary[summaryKey].reach
      : filteredDaily.reduce((acc, d) => acc + d.reach, 0);
    const frequency = useRealReach && summaryKey
      ? summary[summaryKey].frequency
      : (imp > 0 && reach > 0 ? imp / reach : 0);

    return {
      amountSpent: s, impressions: imp, reach, frequency, linkClicks: clicks,
      messagingConversations: convs, videoViews3s: videoViews, thruPlay, reactions, comments, shares,
      avgCpl: convs > 0 ? s / convs : 0,
      avgCtr: imp > 0 ? (clicks / imp) * 100 : 0,
      avgCpc: clicks > 0 ? s / clicks : 0,
      avgCpm: imp > 0 ? (s / imp) * 1000 : 0,
    };
  }, [filteredRows, filteredDaily, useRealReach, summaryKey, summary]);

  return (
    <main className="min-h-screen grid-bg" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>🚴</div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>S2 Bike</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Meta Ads · [RCH] Campanha WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Período total</p>
              <p className="mono text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{fmtDate(dateRange.start)} → {fmtDate(dateRange.end)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Atualizado</p>
              <p className="mono text-xs" style={{ color: "var(--accent-green)" }}>{fmtLastUpdated(lastUpdated)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Logado como</p>
                <p className="mono text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{userName}</p>
              </div>
              <button
                onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
                className="text-xs px-3 py-2 rounded-lg transition-all"
                style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)", background: "transparent", cursor: "pointer" }}>
                Sair
              </button>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex gap-2">
            {availableTabs.map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="text-sm font-semibold px-5 py-2 rounded-full transition-all"
                style={{
                  background: activeTab === tab ? "var(--accent-blue)" : "var(--bg-card)",
                  color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${activeTab === tab ? "var(--accent-blue)" : "var(--border-bright)"}`,
                  cursor: "pointer",
                  boxShadow: activeTab === tab ? "0 0 16px rgba(79,142,247,0.3)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {activeTab === "leads" ? (
          <LeadsCRM leads={leads} />
        ) : (
          <>
            {/* Filtros */}
            <section className="card p-5 animate-in stagger-1">
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Período</p>
                  <div className="flex gap-2">
                    {PRESET_RANGES.map(({ label, getValue }) => (
                      <button key={label} onClick={() => applyPreset(label, getValue)}
                        className="mono text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          border: `1px solid ${activePreset === label ? "var(--accent-blue)" : "var(--border-bright)"}`,
                          background: activePreset === label ? "rgba(79,142,247,0.15)" : "transparent",
                          color: activePreset === label ? "var(--accent-blue)" : "var(--text-secondary)",
                          cursor: "pointer",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>De</p>
                    <input type="date" value={startDate} min={dateRange.start} max={endDate}
                      onChange={e => { setStartDate(e.target.value); setActivePreset(null); }}
                      className="mono text-sm px-3 py-2 rounded-lg outline-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border-bright)", color: "var(--text-primary)", colorScheme: "dark" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Até</p>
                    <input type="date" value={endDate} min={startDate} max={dateRange.end}
                      onChange={e => { setEndDate(e.target.value); setActivePreset(null); }}
                      className="mono text-sm px-3 py-2 rounded-lg outline-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border-bright)", color: "var(--text-primary)", colorScheme: "dark" }} />
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Anúncios</p>
                  <div className="flex flex-wrap gap-2">
                    {adNames.map(name => {
                      const active = selectedAds.includes(name);
                      const color = AD_COLORS[name] ?? "#7a94b0";
                      return (
                        <button key={name} onClick={() => toggleAd(name)}
                          className="text-xs px-3 py-1.5 rounded-full transition-all"
                          style={{ border: `1px solid ${active ? color : "var(--border-bright)"}`, background: active ? `${color}22` : "transparent", color: active ? color : "var(--text-secondary)", cursor: "pointer" }}>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs px-3 py-2 rounded-lg"
                    style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)", background: "transparent", cursor: "pointer" }}>
                    Limpar ×
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <p className="mono text-xs mt-3" style={{ color: "var(--accent-blue)" }}>
                  Exibindo: {fmtDate(startDate)} → {fmtDate(endDate)}
                  {selectedAds.length > 0 && ` · ${selectedAds.join(", ")}`}
                  {" "}· {filteredRows.length} linha{filteredRows.length !== 1 ? "s" : ""}
                </p>
              )}

              {useRealReach && (
                <p className="mono text-xs mt-2" style={{ color: "var(--accent-teal)" }}>
                  ✓ Alcance e frequência calculados pelo Meta para o período exato ({summary[summaryKey!].period})
                </p>
              )}
            </section>

            {/* KPIs — linha 1: volume */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Resumo do Período</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard label="Total Investido" value={`R$ ${fmtBRL(totals.amountSpent)}`} icon="💸" accentColor="var(--accent-orange)" stagger={2} />
                <KPICard label="Impressões" value={totals.impressions.toLocaleString("pt-BR")} icon="👁️" accentColor="var(--accent-blue)" stagger={3} />
                <KPICard
                  label="Alcance"
                  value={totals.reach.toLocaleString("pt-BR")}
                  subvalue={useRealReach ? "✓ real (Meta)" : "estimado (soma diária)"}
                  icon="📡"
                  accentColor="var(--accent-purple)"
                  stagger={4}
                />
                <KPICard
                  label="Frequência"
                  value={totals.frequency.toFixed(2)}
                  subvalue={useRealReach ? "✓ real (Meta)" : "estimada"}
                  icon="🔁"
                  accentColor="var(--accent-teal)"
                  stagger={5}
                />
              </div>
            </section>

            {/* KPIs — linha 2: engajamento */}
            <section>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard label="Cliques no Link" value={totals.linkClicks.toLocaleString("pt-BR")} subvalue={`CTR: ${totals.avgCtr.toFixed(2)}%`} icon="🖱️" accentColor="var(--accent-teal)" stagger={6} />
                <KPICard label="Conversas WhatsApp" value={totals.messagingConversations.toLocaleString("pt-BR")} icon="💬" accentColor="var(--accent-green)" stagger={7} />
                <KPICard label="CPL Médio" value={totals.avgCpl > 0 ? `R$ ${fmtBRL(totals.avgCpl)}` : "—"} subvalue="investimento / conversas" icon="📊" accentColor="var(--accent-purple)" stagger={8} />
                <KPICard label="CPM Médio" value={totals.avgCpm > 0 ? `R$ ${fmtBRL(totals.avgCpm)}` : "—"} icon="🎯" accentColor="var(--accent-orange)" stagger={9} />
              </div>
            </section>

            {/* KPIs — linha 3: vídeo + engajamento */}
            <section>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard label="Videoviews 3s" value={totals.videoViews3s.toLocaleString("pt-BR")} icon="▶️" accentColor="var(--accent-blue)" stagger={10} />
                <KPICard label="ThruPlay" value={totals.thruPlay.toLocaleString("pt-BR")} subvalue={totals.videoViews3s > 0 ? `${((totals.thruPlay / totals.videoViews3s) * 100).toFixed(1)}% completaram` : undefined} icon="✅" accentColor="var(--accent-green)" stagger={11} />
                <KPICard label="Engajamento" value={(totals.reactions + totals.comments + totals.shares).toLocaleString("pt-BR")} subvalue={`${totals.reactions} reações · ${totals.comments} comentários · ${totals.shares} compartilhamentos`} icon="❤️" accentColor="var(--accent-purple)" stagger={12} />
                <KPICard label="Anúncios" value={String(filteredByAd.length)} icon="📣" accentColor="var(--accent-orange)" stagger={13} />
              </div>
            </section>

            {/* Charts temporais */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SpendChart data={filteredDaily} />
              <ConversationsChart data={filteredDaily} />
            </section>
            <section><CPMChart data={filteredDaily} /></section>

            {/* Breakdowns */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PlacementsChart data={placements} />
              <DemographicsChart data={demographics} />
            </section>

            {/* Tabela por anúncio */}
            <section><AdPerformanceTable data={filteredByAd} totalSpent={totals.amountSpent} /></section>
          </>
        )}

        <footer className="text-center pb-8">
          <p className="mono text-xs" style={{ color: "var(--text-muted)" }}>
            Dados via Google Sheets · Atualização automática diária · S2 Bike {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </main>
  );
}
