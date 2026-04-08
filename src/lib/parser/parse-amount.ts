/**
 * Parse Argentine-format currency amounts.
 * "1.234.567,89" → 1234567.89
 * "$ 1.234.567,89" → 1234567.89
 * "1.234.567" → 1234567
 * "(1.234,56)" → -1234.56
 */
export function parseArgAmount(raw: string): number | null {
  let s = raw.trim();

  // Strip currency prefixes
  s = s.replace(/^\$\s*/, "");

  // Detect negative: (amount) or -amount
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1).trim();
  } else if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1).trim();
  }

  // Must contain at least one digit
  if (!/\d/.test(s)) return null;

  // Remove thousands separators (dots) and convert decimal comma to dot
  // Pattern: digits with dots as thousands, optional comma + decimals
  // e.g. "1.234.567,89" or "1.234.567" or "567,89" or "567"
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(s)) {
    // Standard Argentine format with dots and optional comma
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(,\d{1,2})?$/.test(s)) {
    // No thousands separator, optional comma decimal: "567,89" or "12345,50"
    s = s.replace(",", ".");
  } else if (/^\d+(\.\d{1,2})?$/.test(s)) {
    // Already in standard format: "1234.56" or "1234"
    // Leave as-is
  } else {
    return null;
  }

  const n = parseFloat(s);
  if (isNaN(n)) return null;

  return negative ? -n : n;
}

/**
 * Regex pattern that matches an Argentine-format amount at the end of a string.
 * Captures: optional $ prefix, digits with dots, optional comma+decimals
 */
export const AMOUNT_PATTERN =
  /\$?\s*-?\(?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?\)?$/;

/**
 * Extract the rightmost Argentine amount from a line.
 * Returns { description, amount } or null if no amount found.
 */
export function extractLineAmount(
  line: string
): { description: string; amount: number } | null {
  const match = line.match(AMOUNT_PATTERN);
  if (!match) return null;

  const amount = parseArgAmount(match[0]);
  if (amount === null || amount === 0) return null;

  const description = line
    .slice(0, match.index!)
    .replace(/[\s.\-–—_]+$/, "") // trim trailing separators
    .trim();

  if (!description) return null;

  return { description, amount };
}
