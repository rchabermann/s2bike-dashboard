import { fetchDashboardData } from "@/lib/sheets";
import { fetchLeads } from "@/lib/leads";
import { Dashboard } from "@/components/Dashboard";
import { cookies } from "next/headers";

export const revalidate = 3600;

function getSession() {
  const token = cookies().get("auth_token")?.value;
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(decoded) as { user: string; role: string; displayName: string; exp: number };
  } catch {
    return null;
  }
}

export default async function Page() {
  const session = getSession();
  const isAdmin = session?.role === "admin";

  let data;
  let leads = [];
  try {
    const fetches: [Promise<any>, Promise<any>] = [
      fetchDashboardData(),
      isAdmin ? fetchLeads() : Promise.resolve([]),
    ];
    [data, leads] = await Promise.all(fetches);
  } catch (e) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="card p-8 text-center max-w-md">
          <p className="text-2xl mb-2">⚠️</p>
          <p style={{ color: "var(--text-secondary)" }}>Não foi possível carregar os dados.</p>
          <p className="mono text-xs mt-3" style={{ color: "var(--text-muted)" }}>{String(e)}</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      data={data}
      leads={leads}
      userRole={session?.role ?? "client"}
      userName={session?.displayName ?? ""}
    />
  );
}
