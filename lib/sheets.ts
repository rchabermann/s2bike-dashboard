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
  // Handles Brazilian decimal format: 1.234,56 → 1234.56
  const cleaned = val.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch(CSV_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`);

  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim());

  // Skip header row
  const dataLines = lines.slice(1);

  const rows: AdRow[] = dataLines
    .map((line) => {
      // Simple CSV parse (handles basic cases)
      const cols = line.split(",");
      if (cols.length < 14) return null;

      return {
        reach: parseBR(cols[0]),
        impressions: parseBR(cols[1]),
        frequency: parseBR(cols[2]),
        amountSpent: parseBR(cols[3]),
        cpm: parseBR(cols[4]),
        linkClicks: parseBR(cols[5]),
        ctr: parseBR(cols[6]),
        cpc: parseBR(cols[7]),
        messagingConversations: parseBR(cols[8]),
        costPerConversation: parseBR(cols[9]),
        campaignName: cols[10]?.replace(/"/g, "").trim() ?? "",
        adSetName: cols[11]?.replace(/"/g, "").trim() ?? "",
        adName: cols[12]?.replace(/"/g, "").trim() ?? "",
        day: cols[13]?.replace(/"/g, "").trim() ?? "",
      } as AdRow;
    })
    .filter((r): r is AdRow => r !== null && r.day !== "" && r.impressions > 0);

  // Aggregate by day
  const dayMap = new Map<string, DailyMetrics>();
  for (const row of rows) {
    const existing = dayMap.get(row.day);
    if (existing) {
      existing.amountSpent += row.amountSpent;
      existing.impressions += row.impressions;
      existing.reach += row.reach;
      existing.linkClicks += row.linkClicks;
      existing.messagingConversations += row.messagingConversations;
    } else {
      dayMap.set(row.day, {
        day: row.day,
        amountSpent: row.amountSpent,
        impressions: row.impressions,
        reach: row.reach,
        linkClicks: row.linkClicks,
        messagingConversations: row.messagingConversations,
        cpm: row.cpm,
        ctr: row.ctr,
        cpc: row.cpc,
      });
    }
  }

  // Recalculate derived metrics per day
  const daily: DailyMetrics[] = Array.from(dayMap.values())
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      ...d,
      cpm: d.impressions > 0 ? (d.amountSpent / d.impressions) * 1000 : 0,
      ctr: d.impressions > 0 ? (d.linkClicks / d.impressions) * 100 : 0,
      cpc: d.linkClicks > 0 ? d.amountSpent / d.linkClicks : 0,
    }));

  // Aggregate by ad
  const adMap = new Map<string, AdPerformance>();
  for (const row of rows) {
    const existing = adMap.get(row.adName);
    if (existing) {
      existing.amountSpent += row.amountSpent;
      existing.impressions += row.impressions;
      existing.reach += row.reach;
      existing.linkClicks += row.linkClicks;
      existing.messagingConversations += row.messagingConversations;
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

  // Totals
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
