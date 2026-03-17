import Papa from "papaparse";

export interface LeadRow {
  date: string;        // YYYY-MM-DD
  dateRaw: string;     // original DD/MM/YYYY
  name: string;
  phone: string;
  campaign: string;
  bikeInterest: string;
  potential: string;   // Quente | Morno | Frio
  status: string;      // Venda | Negociando | Encerrado
  notes: string;
}

const LEADS_SHEET_ID = "1oJx-hWRGL-SlbpYqT_1MR_fIvAxZHpPiezkAO28Y1cc";
const TABS = ["Fev26", "Mar26"];

function parseDate(val: string): string {
  if (!val || val.trim() === "") return "";
  const s = val.trim();
  // DD/MM/YYYY → YYYY-MM-DD
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
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
        if (!dateRaw || dateRaw === "") return null;
        const name = String(cols[1] ?? "").trim();
        if (!name || name === "") return null;
        return {
          dateRaw,
          date: parseDate(dateRaw),
          name,
          phone: String(cols[2] ?? "").trim(),
          campaign: String(cols[3] ?? "").trim(),
          bikeInterest: String(cols[4] ?? "").trim(),
          potential: String(cols[5] ?? "").trim(),
          status: String(cols[6] ?? "").trim(),
          notes: [cols[7], cols[8], cols[9]].filter(Boolean).map(s => String(s).trim()).filter(s => s).join(" · "),
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
