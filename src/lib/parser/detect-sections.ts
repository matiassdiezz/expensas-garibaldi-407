/**
 * Detect metadata and sections from extracted PDF text.
 * Finds: month/period, cash flow, prorrateo, aviso, vencimiento.
 */

import { parseArgAmount } from "./parse-amount";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

const MONTH_NAMES: Record<string, string> = Object.fromEntries([
  ...MONTHS.map((m, i) => [m.toLowerCase(), String(i + 1).padStart(2, "0")]),
  ["setiembre", "09"], // variant spelling
]);

const MONTH_LABELS: Record<string, string> = Object.fromEntries(
  MONTHS.map((m, i) => [String(i + 1).padStart(2, "0"), m])
);

export interface DetectedMetadata {
  month: string | null; // "2026-03"
  label: string | null; // "Marzo 2026"
  periodo: string | null;
  vencimiento: string | null;
  cashFlow: {
    saldoAnterior: number | null;
    ingresos: number | null;
    egresos: number | null;
    saldoFinal: number | null;
  } | null;
  prorrateo: {
    expensasA: number | null;
    expensasB: number | null;
    totalAPagar: number | null;
  } | null;
  aviso: string | null;
}

function findAmount(line: string): number | null {
  // Find any Argentine-format number in the line
  const matches = line.match(
    /\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?/g
  );
  if (!matches) return null;
  // Take the last (rightmost) match
  return parseArgAmount(matches[matches.length - 1]);
}

export function detectMetadata(lines: string[]): DetectedMetadata {
  const result: DetectedMetadata = {
    month: null,
    label: null,
    periodo: null,
    vencimiento: null,
    cashFlow: null,
    prorrateo: null,
    aviso: null,
  };

  const hasLine = (keyword: string) =>
    lines.some((l) => l.toLowerCase().includes(keyword));

  // --- Month detection ---
  const monthPatterns = [
    /liquidaci[oó]n\s+(?:de\s+expensas?\s*)?[-–]?\s*(\w+)\s+(\d{4})/i,
    /per[ií]odo:?\s*(\w+)\s+(?:de\s+)?(\d{4})/i,
    /mes\s+de\s+(\w+)\s+(?:de\s+)?(\d{4})/i,
    /expensas?\s+(?:ordinarias?\s+)?(\w+)\s+(\d{4})/i,
    // "Marzo 2026" standalone
    /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/i,
  ];

  for (const line of lines) {
    if (result.month) break;
    for (const pattern of monthPatterns) {
      const match = line.match(pattern);
      if (match) {
        const monthName = match[1].toLowerCase();
        const year = match[2];
        const monthNum = MONTH_NAMES[monthName];
        if (monthNum) {
          result.month = `${year}-${monthNum}`;
          result.label = `${MONTH_LABELS[monthNum]} ${year}`;
          break;
        }
      }
    }
  }

  // --- Periodo (raw text) ---
  for (const line of lines) {
    const periodoMatch = line.match(
      /per[ií]odo:?\s*(.+?)(?:\s*$|\s+venc)/i
    );
    if (periodoMatch) {
      result.periodo = periodoMatch[1].trim();
      break;
    }
  }

  // --- Vencimiento ---
  for (const line of lines) {
    const vtoMatch = line.match(
      /venc(?:imiento)?:?\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/i
    );
    if (vtoMatch) {
      const day = vtoMatch[1].padStart(2, "0");
      const month = vtoMatch[2].padStart(2, "0");
      let year = vtoMatch[3];
      if (year.length === 2) year = `20${year}`;
      result.vencimiento = `${year}-${month}-${day}`;
      break;
    }
  }

  // --- Cash Flow ---
  if (
    hasLine("saldo anterior") ||
    hasLine("estado de caja") ||
    hasLine("movimiento de fondos")
  ) {
    const cf = {
      saldoAnterior: null as number | null,
      ingresos: null as number | null,
      egresos: null as number | null,
      saldoFinal: null as number | null,
    };

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes("saldo anterior") || lower.includes("saldo al inicio")) {
        cf.saldoAnterior = findAmount(line);
      }
      if (
        (lower.includes("ingreso") && !lower.includes("saldo")) ||
        lower.includes("recaudacion") ||
        lower.includes("cobrado")
      ) {
        cf.ingresos = findAmount(line);
      }
      if (
        lower.includes("egreso") &&
        !lower.includes("saldo") &&
        !lower.includes("por seccion")
      ) {
        cf.egresos = findAmount(line);
      }
      if (
        lower.includes("saldo final") ||
        lower.includes("saldo al cierre") ||
        lower.includes("saldo resultante")
      ) {
        cf.saldoFinal = findAmount(line);
      }
    }

    if (cf.saldoAnterior !== null || cf.saldoFinal !== null) {
      result.cashFlow = cf;
    }
  }

  // --- Prorrateo ---
  if (
    hasLine("prorrateo") ||
    hasLine("expensas a") ||
    hasLine("total a pagar")
  ) {
    const pr = {
      expensasA: null as number | null,
      expensasB: null as number | null,
      totalAPagar: null as number | null,
    };

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes("expensas a") ||
        lower.includes("ordinarias a") ||
        (lower.includes("ordinaria") && lower.includes(" a"))
      ) {
        pr.expensasA = findAmount(line);
      }
      if (lower.includes("expensas b") || lower.includes("ordinarias b")) {
        pr.expensasB = findAmount(line);
      }
      if (lower.includes("total a pagar") || lower.includes("total expensas")) {
        pr.totalAPagar = findAmount(line);
      }
    }

    if (pr.expensasA !== null || pr.totalAPagar !== null) {
      result.prorrateo = pr;
    }
  }

  // --- Aviso ---
  let avisoStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().trim();
    if (
      lower.startsWith("aviso") ||
      lower.startsWith("comunicado") ||
      lower.startsWith("nota:")
    ) {
      avisoStart = i;
      break;
    }
  }
  if (avisoStart >= 0) {
    const avisoLines: string[] = [];
    for (let i = avisoStart; i < Math.min(avisoStart + 10, lines.length); i++) {
      avisoLines.push(lines[i]);
    }
    result.aviso = avisoLines.join(" ").trim();
  }

  return result;
}
