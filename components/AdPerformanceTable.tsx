"use client";

import { AdPerformance } from "@/lib/sheets";

interface Props {
  data: AdPerformance[];
  totalSpent: number;
}

const AD_COLORS: Record<string, string> = {
  "Racevox Evo": "#4f8ef7",
  "Racevox Evo 2": "#a78bfa",
  "Bike Elétrica - Gavaia e Bruno": "#f97316",
  "Exalt E-trail": "#22c55e",
};

function getColor(name: string) {
  return AD_COLORS[name] ?? "#7a94b0";
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function AdPerformanceTable({ data, totalSpent }: Props) {
  return (
    <div className="card p-6 animate-in stagger-7">
      <h3
        className="text-sm font-semibold uppercase tracking-widest mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        Performance por Anúncio
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Anúncio", "Gasto", "Share", "Impressões", "Alcance", "Cliques", "CTR", "CPC", "Conversas", "Videoviews 3s", "Engajamento"].map(
                (h) => (
                  <th
                    key={h}
                    className="mono text-left py-2 px-3 text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((ad) => {
              const share = totalSpent > 0 ? (ad.amountSpent / totalSpent) * 100 : 0;
              const color = getColor(ad.adName);
              const engagement = ad.reactions + ad.comments + ad.shares;
              return (
                <tr
                  key={ad.adName}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  className="transition-colors hover:bg-[#141d2e]"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {ad.adName}
                      </span>
                    </div>
                  </td>
                  <td className="mono py-3 px-3" style={{ color }}>
                    R$ {fmt(ad.amountSpent)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${share}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="mono text-xs" style={{ color: "var(--text-secondary)" }}>
                        {fmt(share, 1)}%
                      </span>
                    </div>
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "var(--text-secondary)" }}>
                    {ad.impressions.toLocaleString("pt-BR")}
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "var(--text-secondary)" }}>
                    {ad.reach.toLocaleString("pt-BR")}
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "var(--text-secondary)" }}>
                    {ad.linkClicks}
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "var(--text-secondary)" }}>
                    {fmt(ad.avgCtr)}%
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "var(--text-secondary)" }}>
                    {ad.avgCpc > 0 ? `R$ ${fmt(ad.avgCpc)}` : "—"}
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "#22c55e" }}>
                    {ad.messagingConversations || "—"}
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "var(--accent-purple)" }}>
                    {ad.videoViews3s ? ad.videoViews3s.toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="mono py-3 px-3" style={{ color: "var(--accent-teal)" }}>
                    {engagement ? engagement.toLocaleString("pt-BR") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
