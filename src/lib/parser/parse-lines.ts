/**
 * Parse expense line items from extracted PDF text.
 * Detects description + amount pairs and assigns categories.
 */

import { extractLineAmount } from "./parse-amount";
import { classifyCategory, detectSectionHeader } from "./category-map";
import type { ExpenseCategory } from "@/types/expense";

export interface ParsedItem {
  category: ExpenseCategory;
  description: string;
  amount: number;
}

// Lines that should be skipped (headers, totals, structural elements)
const SKIP_PATTERNS = [
  /^total/i,
  /^sub\s*total/i,
  /^gran\s+total/i,
  /liquidaci[oó]n/i,
  /^consorcio/i,
  /^administraci[oó]n\s/i,
  /^direcci[oó]n/i,
  /^c\.?u\.?i\.?t/i,
  /^saldo\s+(anterior|final|al\s+cierre|resultante)/i,
  /^ingreso/i,
  /^egreso/i,
  /^recaudaci[oó]n/i,
  /^prorrateo/i,
  /^expensas?\s+[ab]/i,
  /^total\s+a\s+pagar/i,
  /^vencimiento/i,
  /^per[ií]odo/i,
  /^aviso/i,
  /^comunicado/i,
  /^nota:/i,
  /^p[aá]gina\s+\d/i,
  /^\d+\s*\/\s*\d+$/, // page numbers like "1/3"
  /^unidad\s+funcional/i,
  /^departamento/i,
  /^propietario/i,
  /^coeficiente/i,
];

function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return true;
  return SKIP_PATTERNS.some((p) => p.test(trimmed));
}

export function parseExpenseItems(lines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  let currentSection: ExpenseCategory | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is a section header
    const sectionCat = detectSectionHeader(trimmed);
    if (sectionCat) {
      currentSection = sectionCat;
      // Section headers might also contain an amount (subtotal) — skip those
      continue;
    }

    // Skip structural lines
    if (shouldSkipLine(trimmed)) continue;

    // Try to extract a description + amount pair
    const extracted = extractLineAmount(trimmed);
    if (!extracted) continue;

    // Skip very small amounts (likely page numbers or references)
    if (extracted.amount < 10) continue;

    // Classify category
    const category = classifyCategory(
      extracted.description,
      currentSection ?? undefined
    );

    items.push({
      category,
      description: extracted.description,
      amount: extracted.amount,
    });
  }

  return items;
}
