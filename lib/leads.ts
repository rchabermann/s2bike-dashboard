import Papa from "papaparse";

export interface LeadRow {
  date: string;
  dateRaw: string;
  name: string;
  phone: string;
  campaign: string;
  bikeInterest: string;
  potential: string;
  status: string;
  notes: string;
  saleValue: number;
}

const LEADS_SHEET_ID = "1oJx-hWRGL-SlbpYqT_1MR_fIvAxZHpPiezkAO28Y1cc";
const TABS = ["Fev26", "Mar26"];

function parseDate(val: string): string {
  if (!val || val.trim() === "") return "";
  const s = val.trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

function parseSaleValue(cols: string[]): number {
  // Check columns 8-11 for monetary values
  for (let i = 8; i <= 11; i++) {
    const val = String(cols[i] ?? "").trim();
    if (!val) continue;
    // Match patterns like R$18.990,50 or 250,00 or 6.925,50
    const cleaned = val.replace(/R\$\s*/g, "").replace(/\./g, "").replace(",", ".").trim();
    const n = parseFloat(cleaned);
    if (!isNaN(n) && n > 0 && n < 1000000) return n;
  }
  return 0;
}

async function fetchTab(tabName: string): Promise<LeadRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${LEADS_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(tabName)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const text = await res.text();
    const firstLine = text.split("\n")[0] ?? "";
    const delimiter = firstLine.includes(";") ? ";" : ",";
    const parsed = Papa.parse<string[]>(text, { delimiter, skipEmptyLines: true });
    if (!parsed.data || parsed.data.length < 2) return [];

    return parsed.data.slice(1)
      .map((cols): LeadRow | null => {
        if (!cols || cols.length < 2) return null;
        const dateRaw = String(cols[0] ?? "").trim();
        if (!dateRaw) return null;
        const name = String(cols[1] ?? "").trim();
        if (!name) return null;
        const status = String(cols[6] ?? "").trim();
        const saleValue = status === "Venda" ? parseSaleValue(cols.map(c => String(c))) : 0;
        return {
          dateRaw,
          date: parseDate(dateRaw),
          name,
          phone: String(cols[2] ?? "").trim(),
          campaign: String(cols[3] ?? "").trim(),
          bikeInterest: String(cols[4] ?? "").trim(),
          potential: String(cols[5] ?? "").trim(),
          status,
          notes: [cols[7], cols[8]].filter(Boolean).map(s => String(s).trim()).filter(s => s && !s.match(/^R?\$?[\d.,]+$/)).join(" · "),
          saleValue,
        };
      })
      .filter((r): r is LeadRow => r !== null);
  } catch {
    return [];
  }
}

export async function fetchLeads(): Promise<LeadRow[]> {
  const results = await Promise.all(TABS.map(fetchTab));
  const all = results.flat().filter(r => r.date !== "");
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all;
}
