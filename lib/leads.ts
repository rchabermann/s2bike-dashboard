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

const LEADS_SHEET_ID = process.env.LEADS_SHEET_ID;
if (!LEADS_SHEET_ID) throw new Error("LEADS_SHEET_ID env var not set");

const TAB_GIDS = ["682545657", "953690557", "1628718609"]; // Fev26, Mar26, Abr26

function parseDate(val: string): string {
  if (!val || val.trim() === "") return "";
  const s = val.trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

function extractValue(text: string): number {
  if (!text || text.trim() === "") return 0;
  // Match monetary value anywhere in string: R$18.990,50 or 6.925,50 or 250,00
  const match = text.match(/R?\$?\s*([\d.]+,\d{2})/);
  if (match) {
    const cleaned = match[1].replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return (!isNaN(n) && n > 0) ? n : 0;
  }
  return 0;
}

async function fetchTabByGid(gid: string): Promise<LeadRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${LEADS_SHEET_ID}/export?format=csv&gid=${gid}`;
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
        if (!name) return null;

        const status = String(cols[6] ?? "").trim();

        // Conclusão = last non-empty column (col J = index 9, or beyond)
        let conclusion = "";
        for (let i = cols.length - 1; i >= 7; i--) {
          const v = String(cols[i] ?? "").trim();
          if (v) { conclusion = v; break; }
        }

        // Sale value: only if status is "Venda"
        // Check col J (index 9) first (dedicated Conclusão column), then scan backwards
        let saleValue = 0;
        if (status === "Venda") {
          // Try col J first (index 9)
          const colJ = String(cols[9] ?? "").trim();
          if (colJ) saleValue = extractValue(colJ);
          // If not found, scan other columns for monetary value
          if (saleValue === 0) {
            for (let i = cols.length - 1; i >= 7; i--) {
              const v = String(cols[i] ?? "").trim();
              const extracted = extractValue(v);
              if (extracted > 0) { saleValue = extracted; break; }
            }
          }
        }

        // Notes: prefer col 8 (more recent update), fall back to col 7
        const note8 = String(cols[8] ?? "").trim();
        const note7 = String(cols[7] ?? "").trim();
        const noteCandidate = (note8 && extractValue(note8) === 0) ? note8
          : (note7 && extractValue(note7) === 0) ? note7
          : "";
        const notes = noteCandidate;

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
  const results = await Promise.all(TAB_GIDS.map(fetchTabByGid));
  const all = results.flat().filter(r => r.date !== "");

  // Deduplicate: same phone + date + name = same lead across tabs
  const seen = new Set<string>();
  const deduped: LeadRow[] = [];
  for (const lead of all) {
    const key = `${lead.phone.replace(/\D/g, "")}|${lead.date}|${lead.name.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(lead);
    }
  }

  deduped.sort((a, b) => b.date.localeCompare(a.date));
  return deduped;
}
