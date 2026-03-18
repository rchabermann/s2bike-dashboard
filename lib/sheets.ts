import Papa from "papaparse";

export interface AdRow {
  reach: number;
  impressions: number;
  frequency: number;
  amountSpent: number;
  cpm: number;
  linkClicks: number;
  ctr: number;
  cpc: number;
  messagingConversations: number;
  costPerConversation: number;
  campaignName: string;
  adSetName: string;
  adName: string;
  day: string;
}

export interface DailyMetrics {
  day: string;
  amountSpent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  messagingConversations: number;
  frequency: number;
  cpm: number;
  ctr: number;
  cpc: number;
}

export interface AdPerformance {
  adName: string;
  amountSpent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  messagingConversations: number;
  avgCpc: number;
  avgCpm: number;
  avgCtr: number;
}

export interface DashboardData {
  rows: AdRow[];
  daily: DailyMetrics[];
  byAd: AdPerformance[];
  totals: {
    amountSpent: number;
    impressions: number;
    reach: number;
    linkClicks: number;
    messagingConversations: number;
    avgCpm: number;
    avgCtr: number;
    avgCpc: number;
  };
  lastUpdated: string;
  dateRange: { start: string; end: string };
}

const SHEET_ID = "1Rl3EfTIVs1WbGPQfY-RbNUZiGhgG9mawkhpX3Bf2omU";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

function parseBR(val: string): number {
  if (!val || val.trim() === "") return 0;
  const s = val.trim();
  // Brazilian: 1.234,56
  if (s.includes(".") && s.includes(",")) {
    return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  }
  // Decimal comma only: 1,58
  if (s.includes(",")) {
    return parseFloat(s.replace(",", ".")) || 0;
  }
  return parseFloat(s) || 0;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch(CSV_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`);

  const text = await res.text();

  // Detect delimiter: Google Sheets uses ; for pt-BR locale
  const firstLine = text.split("\n")[0] ?? "";
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const parsed = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: true,
  });

  if (!parsed.data || parsed.data.length < 2) {
    throw new Error("Planilha vazia ou nao pode ser lida.");
  }

  const dataRows = parsed.data.slice(1);

  const rows: AdRow[] = dataRows
    .map((cols): AdRow | null => {
      if (!cols || cols.length < 14) return null;
      const day = String(cols[13] ?? "").replace(/"/g, "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
      const impressions = parseBR(String(cols[1]));
      if (impressions === 0) return null;
      return {
        reach: parseBR(String(cols[0])),
        impressions,
        frequency: parseBR(String(cols[2])),
        amountSpent: parseBR(String(cols[3])),
        cpm: parseBR(String(cols[4])),
        linkClicks: parseBR(String(cols[5])),
        ctr: parseBR(String(cols[6])),
        cpc: parseBR(String(cols[7])),
        messagingConversations: parseBR(String(cols[8])),
        costPerConversation: parseBR(String(cols[9])),
        campaignName: String(cols[10] ?? "").replace(/"/g, "").trim(),
        adSetName: String(cols[11] ?? "").replace(/"/g, "").trim(),
        adName: String(cols[12] ?? "").replace(/"/g, "").trim(),
        day,
      };
    })
    .filter((r): r is AdRow => r !== null);

  const dayMap = new Map<string, DailyMetrics>();
  for (const row of rows) {
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
        frequency: row.frequency,
        cpm: 0,
        ctr: 0,
        cpc: 0,
      });
    }
  }

  const daily: DailyMetrics[] = Array.from(dayMap.values())
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      ...d,
      frequency: d.reach > 0 ? d.impressions / d.reach : 0,
      cpm: d.impressions > 0 ? (d.amountSpent / d.impressions) * 1000 : 0,
      ctr: d.impressions > 0 ? (d.linkClicks / d.impressions) * 100 : 0,
      cpc: d.linkClicks > 0 ? d.amountSpent / d.linkClicks : 0,
    }));

  const adMap = new Map<string, AdPerformance>();
  for (const row of rows) {
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
        avgCpc: 0,
        avgCpm: 0,
        avgCtr: 0,
      });
    }
  }

  const byAd: AdPerformance[] = Array.from(adMap.values())
    .map((a) => ({
      ...a,
      avgCpm: a.impressions > 0 ? (a.amountSpent / a.impressions) * 1000 : 0,
      avgCtr: a.impressions > 0 ? (a.linkClicks / a.impressions) * 100 : 0,
      avgCpc: a.linkClicks > 0 ? a.amountSpent / a.linkClicks : 0,
    }))
    .sort((a, b) => b.amountSpent - a.amountSpent);

  const totalSpent = rows.reduce((s, r) => s + r.amountSpent, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalReach = daily.reduce((s, d) => s + d.reach, 0);
  const totalClicks = rows.reduce((s, r) => s + r.linkClicks, 0);
  const totalConversations = rows.reduce((s, r) => s + r.messagingConversations, 0);
  const dates = rows.map((r) => r.day).sort();

  return {
    rows,
    daily,
    byAd,
    totals: {
      amountSpent: totalSpent,
      impressions: totalImpressions,
      reach: totalReach,
      linkClicks: totalClicks,
      messagingConversations: totalConversations,
      avgCpm: totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0,
      avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
    },
    lastUpdated: new Date().toISOString(),
    dateRange: {
      start: dates[0] ?? "",
      end: dates[dates.length - 1] ?? "",
    },
  };
}
