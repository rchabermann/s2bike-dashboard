import { fetchDashboardData } from "@/lib/sheets";
import { KPICard } from "@/components/KPICard";
import { SpendChart } from "@/components/SpendChart";
import { ConversationsChart } from "@/components/ConversationsChart";
import { AdPerformanceTable } from "@/components/AdPerformanceTable";
import { CPMChart } from "@/components/CPMChart";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Revalidate every hour. The Cron Job in vercel.json also triggers daily.
export const revalidate = 3600;

function fmtDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtLastUpdated(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default async function Dashboard() {
  let data;
  try {
    data = await fetchDashboardData();
  } catch (e) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="card p-8 text-center max-w-md">
          <p className="text-2xl mb-2">⚠️</p>
          <p style={{ color: "var(--text-secondary)" }}>
            Não foi possível carregar os dados da planilha. Certifique-se de que ela está pública.
          </p>
          <p className="mono text-xs mt-3" style={{ color: "var(--text-muted)" }}>{String(e)}</p>
        </div>
      </div>
    );
  }

  const { totals, daily, byAd, dateRange, lastUpdated } = data;

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
              <h1 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                S2 Bike
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Meta Ads · [RCH] Campanha WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Período</p>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* KPI Grid */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
            Resumo do Período
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            <KPICard
              label="Total Investido"
              value={`R$ ${fmtBRL(totals.amountSpent)}`}
              icon="💸"
              accentColor="var(--accent-orange)"
              stagger={1}
            />
            <KPICard
              label="Impressões"
              value={totals.impressions.toLocaleString("pt-BR")}
              icon="👁️"
              accentColor="var(--accent-blue)"
              stagger={2}
            />
            <KPICard
              label="Alcance"
              value={totals.reach.toLocaleString("pt-BR")}
              icon="📡"
              accentColor="var(--accent-purple)"
              stagger={3}
            />
            <KPICard
              label="Cliques no Link"
              value={totals.linkClicks.toLocaleString("pt-BR")}
              subvalue={`CTR médio: ${totals.avgCtr.toFixed(2)}%`}
              icon="🖱️"
              accentColor="var(--accent-teal)"
              stagger={4}
            />
            <KPICard
              label="Conversas WhatsApp"
              value={totals.messagingConversations.toLocaleString("pt-BR")}
              icon="💬"
              accentColor="var(--accent-green)"
              stagger={5}
            />
            <KPICard
              label="CPM Médio"
              value={`R$ ${fmtBRL(totals.avgCpm)}`}
              icon="📊"
              accentColor="var(--accent-purple)"
              stagger={6}
            />
            <KPICard
              label="CPC Médio"
              value={totals.avgCpc > 0 ? `R$ ${fmtBRL(totals.avgCpc)}` : "—"}
              icon="🎯"
              accentColor="var(--accent-teal)"
              stagger={7}
            />
            <KPICard
              label="Anúncios Ativos"
              value={String(byAd.length)}
              icon="📣"
              accentColor="var(--accent-orange)"
              stagger={8}
            />
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpendChart data={daily} />
          <ConversationsChart data={daily} />
        </section>

        {/* Charts Row 2 */}
        <section>
          <CPMChart data={daily} />
        </section>

        {/* Ad Performance Table */}
        <section>
          <AdPerformanceTable data={byAd} totalSpent={totals.amountSpent} />
        </section>

        {/* Footer */}
        <footer className="text-center pb-8">
          <p className="mono text-xs" style={{ color: "var(--text-muted)" }}>
            Dados via Google Sheets · Atualização automática diária · S2 Bike {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </main>
  );
}
