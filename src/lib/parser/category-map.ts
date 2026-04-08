import type { ExpenseCategory } from "@/types/expense";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Pre-normalized at module load — avoids re-normalizing ~90 keywords per call
const CATEGORY_KEYWORDS: Array<[ExpenseCategory, string[]]> = ([
  ["sueldos", ["sueldo", "jornal", "haberes", "sac ", "aguinaldo", "vacaciones", "encargado", "portero", "porteria"]],
  ["cargas-sociales", ["afip", "f.931", "f 931", "suss", "fateryh", "seracarh", "suterh", " art ", "obra social", "cargas sociales", "aportes", "contribuciones", "sindicato"]],
  ["servicios-publicos", ["aysa", "edenor", "edesur", "metrogas", "naturgy", "agua ", " luz ", " gas ", "electricidad", "energia"]],
  ["abonos-servicios", ["abono", "fumigacion", "fumigaciones", "desinfeccion", "jardineria", "matafuegos", "extincenter", "antena", "portones", "desratizacion", "proambiental"]],
  ["reparaciones", ["reparacion", "obra ", "arreglo", "filtracion", "restaurar", "revoque", "cloaca", "destapacion", "albañil"]],
  ["mantenimiento", ["pintura", "pintureria", "ferreteria", "materiales", "plomeria", "plomero", "cerrajeria", "electricista", "vidrio", "vidriero"]],
  ["gastos-bancarios", ["comision", "comisión", "mantenimiento cuenta", "ley 25413", "imp. ley", "debito", "credito bancario", "gastos bancarios", "banco"]],
  ["seguros-gastos", ["seguro", "met life", "poliza", "siniestro", "aseguradora", "federacion patronal"]],
  ["administracion", ["honorarios", "administracion", "administración", "gestion"]],
  ["impuestos", ["abl", "iibb", "municipal", "rentas", "tasa ", "impuesto", "agip"]],
  ["ascensores", ["ascensor", "ascensores", "virs", "elevador"]],
  ["limpieza", ["limpieza", "articulos de limpieza", "productos limpieza", "lavandina"]],
  ["extraordinarias", ["extraordinari", "derrame", "cuota especial"]],
  ["fondo-reserva", ["fondo de reserva", "reserva legal", "fondo reserva"]],
] as Array<[ExpenseCategory, string[]]>).map(
  ([cat, kws]) => [cat, kws.map(normalize)] as [ExpenseCategory, string[]]
);

/**
 * Section header patterns that map to categories.
 * Used when items appear under a recognized section header.
 */
const SECTION_PATTERNS: Array<[ExpenseCategory, RegExp]> = [
  ["sueldos", /^[A-Z]\)?\s*sueldos/i],
  ["cargas-sociales", /^[A-Z]\)?\s*cargas\s+sociales/i],
  ["servicios-publicos", /^[A-Z]\)?\s*servicios?\s+p[uú]blicos?/i],
  ["abonos-servicios", /^[A-Z]\)?\s*abonos?\s+(de\s+)?servicios?/i],
  ["mantenimiento", /^[A-Z]\)?\s*mantenimiento/i],
  ["reparaciones", /^[A-Z]\)?\s*reparaciones|trabajos\s+en\s+el\s+edificio/i],
  ["gastos-bancarios", /^[A-Z]\)?\s*gastos?\s+bancarios?/i],
  ["seguros-gastos", /^[A-Z]\)?\s*seguros?/i],
  ["administracion", /^[A-Z]\)?\s*(gastos?\s+de\s+)?administraci[oó]n/i],
  ["limpieza", /^[A-Z]\)?\s*(gastos?\s+de\s+)?limpieza/i],
  ["extraordinarias", /^[A-Z]\)?\s*extraordinari/i],
  ["otros", /^[A-Z]\)?\s*(gastos?\s+varios|gastos?\s+particulares)/i],
];

export function classifyCategory(
  description: string,
  sectionCategory?: ExpenseCategory
): ExpenseCategory {
  if (sectionCategory) return sectionCategory;

  const normDesc = normalize(description);
  for (const [cat, keywords] of CATEGORY_KEYWORDS) {
    for (const kw of keywords) {
      if (normDesc.includes(kw)) {
        return cat;
      }
    }
  }

  return "otros";
}

/**
 * Detect if a line is a section header. Returns the category or null.
 */
export function detectSectionHeader(line: string): ExpenseCategory | null {
  const trimmed = line.trim();
  for (const [cat, pattern] of SECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return cat;
    }
  }
  return null;
}
