import { fetchDashboardData } from "@/lib/sheets";
import { fetchLeads } from "@/lib/leads";
import { Dashboard } from "@/components/Dashboard";

export const revalidate = 3600;

export default async function Page() {
  let data;
  let leads = [];
  try {
    [data, leads] = await Promise.all([fetchDashboardData(), fetchLeads()]);
  } catch (e) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="card p-8 text-center max-w-md">
          <p className="text-2xl mb-2">⚠️</p>
          <p style={{ color: "var(--text-secondary)" }}>Não foi possível carregar os dados. Verifique se as planilhas estão públicas.</p>
          <p className="mono text-xs mt-3" style={{ color: "var(--text-muted)" }}>{String(e)}</p>
        </div>
      </div>
    );
  }

  return <Dashboard data={data} leads={leads} />;
}
