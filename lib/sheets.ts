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
  costPerResult: number;
  campaignName: string;
  adSetName: string;
  adName: string;
  day: string;
  engPost: number;
  reactions: number;
  comments: number;
  shares: number;
  videoViews3s: number;
  thruPlay: number;
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
  videoViews3s: number;
  thruPlay: number;
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
  reactions: number;
  comments: number;
  shares: number;
  videoViews3s: number;
  thruPlay: number;
}

export interface PeriodSummary {
  period: string;
  investment: number;
  impressions: number;
  reach: number;
  frequency: number;
  linkClicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  results: number;
  costPerResult: number;
  waConversations: number;
  cplWhatsapp: number;
  videoViews3s: number;
  thruPlay: number;
}

export interface PlacementRow {
  platform: string;
  placement: string;
  amountSpent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  results: number;
  waConversations: number;
  videoViews3s: number;
}

export interface DemographicRow {
  ageRange: string;
  gender: string;
  amountSpent: number;
  impressions: number;
  reach: number;
  ctr: number;
  cpm: number;
  results: number;
  waConversations: number;
  videoViews3s: number;
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
  summary: { "7": PeriodSummary; "14": PeriodSummary; "30": PeriodSummary };
  placements: PlacementRow[];
  demographics: DemographicRow[];
  lastUpdated: string;
  dateRange: { start: string; end: string };
}

const SHEET_ID = process.env.DASHBOARD_SHEET_ID;
if (!SHEET_ID) throw new Error("DASHBOARD_SHEET_ID env var not set");

// Abas da nova planilha
const GID_ANUNCIOS = "79328799";
const GID_RESUMO = "1031874185";
const GID_POSICIONAMENTOS = "726176718";
const GID_DEMOGRAFICOS = "1162444530";

function sheetUrl(gid: string) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
}

function parseBR(val: string): number {
  if (!val || val.trim() === "") return 0;
  const s = val.trim().replace(/%$/, "").trim();
  if (s === "-" || s === "") return 0;
  if (s.includes(".") && s.includes(",")) {
    return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (s.includes(",")) {
    return parseFloat(s.replace(",", ".")) || 0;
  }
  return parseFloat(s) || 0;
}

async function fetchTabCSV(gid: string): Promise<string[][]> {
  try {
    const res = await fetch(sheetUrl(gid), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const text = await res.text();
    const firstLine = text.split("\n")[0] ?? "";
    const delimiter = firstLine.includes(";") ? ";" : ",";
    const parsed = Papa.parse<string[]>(text, { delimiter, skipEmptyLines: true });
    return parsed.data ?? [];
  } catch {
    return [];
  }
}

// Colunas da aba Anúncios (gid=79328799):
// 0=Data Início, 2=Campanha, 5=Conjunto, 7=Anúncio
// 10=Investimento, 12=Impressões, 13=Alcance, 14=Frequência
// 18=Cliques no Link, 23=CTR Total(%), 27=CPC, 28=CPM
// 35=Resultados, 37=Custo/Resultado
// 39=Eng.Post, 41=Reações, 42=Comentários, 43=Compartilhamentos
// 47=Videoviews(3s), 50=ThruPlay
// 60=Conversas WhatsApp(7d)
function parseAnuncios(data: string[][]): AdRow[] {
  return data
    .slice(1)
    .map((cols): AdRow | null => {
      if (!cols || cols.length < 10) return null;
      const day = String(cols[0] ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
      const impressions = parseBR(String(cols[12]));
      if (impressions === 0) return null;
      return {
        day,
        campaignName: String(cols[2] ?? "").trim(),
        adSetName: String(cols[5] ?? "").trim(),
        adName: String(cols[7] ?? "").trim(),
        amountSpent: parseBR(String(cols[10])),
        impressions,
        reach: parseBR(String(cols[13])),
        frequency: parseBR(String(cols[14])),
        linkClicks: parseBR(String(cols[18])),
        ctr: parseBR(String(cols[23])),
        cpc: parseBR(String(cols[27])),
        cpm: parseBR(String(cols[28])),
        costPerResult: parseBR(String(cols[37])),
        engPost: parseBR(String(cols[39])),
        reactions: parseBR(String(cols[41])),
        comments: parseBR(String(cols[42])),
        shares: parseBR(String(cols[43])),
        videoViews3s: parseBR(String(cols[47])),
        thruPlay: parseBR(String(cols[50])),
        messagingConversations: parseBR(String(cols[60])),
      };
    })
    .filter((r): r is AdRow => r !== null);
}

// Aba Resumo: linhas = métricas, colunas = janelas de tempo (7/14/30 dias)
function parseResumo(data: string[][]): DashboardData["summary"] {
  const rowMap = new Map<string, string[]>();
  for (const row of data) {
    if (row.length >= 2) {
      const key = String(row[0] ?? "").trim();
      if (key && !key.startsWith("──")) rowMap.set(key, row);
    }
  }

  function get(name: string, col: number): number {
    const row = rowMap.get(name);
    if (!row) return 0;
    return parseBR(String(row[col] ?? ""));
  }

  function makeSummary(col: number): PeriodSummary {
    const periodRow = rowMap.get("Período");
    return {
      period: periodRow ? String(periodRow[col] ?? "") : "",
      investment: get("Investimento (R$)", col),
      impressions: get("Impressões", col),
      reach: get("Alcance ✓ (real)", col),
      frequency: get("Frequência ✓ (real)", col),
      linkClicks: get("Cliques no Link", col),
      ctr: get("CTR (%)", col),
      cpm: get("CPM (R$)", col),
      cpc: get("CPC (R$)", col),
      results: get("Resultados", col),
      costPerResult: get("Custo/Resultado(R$)", col),
      waConversations: get("Conversas WhatsApp", col),
      cplWhatsapp: get("CPL WhatsApp (R$)", col),
      videoViews3s: get("Videoviews (3s)", col),
      thruPlay: get("ThruPlay", col),
    };
  }

  return { "7": makeSummary(1), "14": makeSummary(2), "30": makeSummary(3) };
}

// Colunas Posicionamentos / Demograficos (estrutura idêntica, apenas dim. cols diferentes):
// 3=dim1, 4=dim2, 5=Investimento, 6=Impressões, 7=Alcance, 8=Frequência
// 9=Cliques(Total), 10=Cliques no Link, 11=CTR, 12=CPC, 13=CPM
// 14=Resultados, 23=Conversas WhatsApp, 26=Videoviews(3s)
function parsePlacements(data: string[][]): PlacementRow[] {
  return data
    .slice(1)
    .map((cols): PlacementRow | null => {
      if (!cols || cols.length < 15) return null;
      const platform = String(cols[3] ?? "").trim();
      if (!platform) return null;
      return {
        platform,
        placement: String(cols[4] ?? "").trim(),
        amountSpent: parseBR(String(cols[5])),
        impressions: parseBR(String(cols[6])),
        reach: parseBR(String(cols[7])),
        linkClicks: parseBR(String(cols[10])),
        ctr: parseBR(String(cols[11])),
        cpm: parseBR(String(cols[13])),
        cpc: parseBR(String(cols[12])),
        results: parseBR(String(cols[14])),
        waConversations: parseBR(String(cols[23])),
        videoViews3s: parseBR(String(cols[26])),
      };
    })
    .filter((r): r is PlacementRow => r !== null);
}

function parseDemographics(data: string[][]): DemographicRow[] {
  return data
    .slice(1)
    .map((cols): DemographicRow | null => {
      if (!cols || cols.length < 15) return null;
      const ageRange = String(cols[3] ?? "").trim();
      if (!ageRange) return null;
      return {
        ageRange,
        gender: String(cols[4] ?? "").trim(),
        amountSpent: parseBR(String(cols[5])),
        impressions: parseBR(String(cols[6])),
        reach: parseBR(String(cols[7])),
        ctr: parseBR(String(cols[11])),
        cpm: parseBR(String(cols[13])),
        results: parseBR(String(cols[14])),
        waConversations: parseBR(String(cols[23])),
        videoViews3s: parseBR(String(cols[26])),
      };
    })
    .filter((r): r is DemographicRow => r !== null);
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [anunciosData, resumoData, posicionamentosData, demograficosData] =
    await Promise.all([
      fetchTabCSV(GID_ANUNCIOS),
      fetchTabCSV(GID_RESUMO),
      fetchTabCSV(GID_POSICIONAMENTOS),
      fetchTabCSV(GID_DEMOGRAFICOS),
    ]);

  const rows = parseAnuncios(anunciosData);
  const summary = parseResumo(resumoData);
  const placements = parsePlacements(posicionamentosData);
  const demographics = parseDemographics(demograficosData);

  // Métricas diárias
  const dayMap = new Map<string, DailyMetrics>();
  for (const row of rows) {
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

  const daily: DailyMetrics[] = Array.from(dayMap.values())
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      ...d,
      frequency: d.reach > 0 ? d.impressions / d.reach : 0,
      cpm: d.impressions > 0 ? (d.amountSpent / d.impressions) * 1000 : 0,
      ctr: d.impressions > 0 ? (d.linkClicks / d.impressions) * 100 : 0,
      cpc: d.linkClicks > 0 ? d.amountSpent / d.linkClicks : 0,
    }));

  // Performance por anúncio
  const adMap = new Map<string, AdPerformance>();
  for (const row of rows) {
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
    summary,
    placements,
    demographics,
    lastUpdated: new Date().toISOString(),
    dateRange: { start: dates[0] ?? "", end: dates[dates.length - 1] ?? "" },
  };
}
