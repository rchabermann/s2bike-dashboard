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
  conclusion: string;
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

function parseValue(val: string): number {
  if (!val || val.trim() === "") return 0;
  // Remove R$, spaces, dots (thousand separator), replace comma with dot
  const cleaned = val.replace(/R\$\s*/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return (!isNaN(n) && n > 0 && n < 10000000) ? n : 0;
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
        if (!dateRaw || !/\d/.test(dateRaw)) return null;
        const name = String(cols[1] ?? "").trim();
        if (!name || name === "") return null;

        const status = String(cols[6] ?? "").trim();

        // "Conclusão" = last non-empty column after col 7
        let conclusion = "";
        for (let i = cols.length - 1; i >= 7; i--) {
          const v = String(cols[i] ?? "").trim();
          if (v) { conclusion = v; break; }
        }

        // Sale value: only if status === "Venda", read from conclusion column
        let saleValue = 0;
        if (status === "Venda" && conclusion) {
          saleValue = parseValue(conclusion);
        }

        // Notes: columns 7 and 8, excluding the value itself
        const noteParts = [cols[7], cols[8]]
          .map(c => String(c ?? "").trim())
          .filter(v => v && parseValue(v) === 0);
        const notes = noteParts.join(" · ");

        return {
          dateRaw,
          date: parseDate(dateRaw),
          name,
          phone: String(cols[2] ?? "").trim(),
          campaign: String(cols[3] ?? "").trim(),
          bikeInterest: String(cols[4] ?? "").trim(),
          potential: String(cols[5] ?? "").trim(),
          status,
          notes,
          saleValue,
          conclusion,
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

  // Deduplicate: same phone + same date = same lead (appears in multiple tabs)
  const seen = new Set<string>();
  const deduped: LeadRow[] = [];
  for (const lead of all) {
    const key = `${lead.phone.replace(/\D/g, "")}|${lead.date}|${lead.bikeInterest}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(lead);
    }
  }

  deduped.sort((a, b) => b.date.localeCompare(a.date));
  return deduped;
}
