export type ExpenseCategory = string;

export const STANDARD_CATEGORIES = [
  "sueldos",
  "cargas-sociales",
  "servicios-publicos",
  "abonos-servicios",
  "mantenimiento",
  "reparaciones",
  "gastos-bancarios",
  "seguros-gastos",
  "administracion",
  "impuestos",
  "ascensores",
  "limpieza",
  "extraordinarias",
  "fondo-reserva",
  "otros",
] as const;

export interface ExpenseItem {
  category: ExpenseCategory;
  description: string;
  amount: number;
}

export interface MonthData {
  month: string; // "2025-07"
  label: string; // "Julio 2025"
  items: ExpenseItem[];
  total: number;
  expensasA: number; // Total Expensas A (ordinarias) del prorrateo
}

export const CATEGORY_LABELS: Record<string, string> = {
  sueldos: "A · Sueldos",
  "cargas-sociales": "B · Cargas Sociales",
  "servicios-publicos": "C · Servicios Públicos",
  "abonos-servicios": "D · Abonos y Servicios",
  mantenimiento: "E · Mantenimiento",
  reparaciones: "F · Reparaciones",
  "gastos-bancarios": "G · Gastos Bancarios",
  "seguros-gastos": "H · Seguros y Gastos",
  administracion: "I · Administración",
  impuestos: "J · Impuestos",
  ascensores: "K · Ascensores",
  limpieza: "L · Limpieza",
  extraordinarias: "M · Extraordinarias",
  "fondo-reserva": "N · Fondo de Reserva",
  otros: "O · Otros",
};

export function getCategoryLabel(cat: string): string {
  if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
  // Fallback: capitalize and replace hyphens with spaces
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Extended types for full liquidacion data (DB-backed)

export interface CashFlow {
  saldoAnterior: number;
  saldoAnteriorFecha?: string;
  ingresos: number;
  egresos: number;
  extras: Array<{ tipo?: string; monto: number; descripcion: string }>;
  saldoFinal: number;
}

export interface Prorrateo {
  expensasA: number;
  expensasB: number;
  totalAPagar: number;
}

export interface LiquidacionFull extends MonthData {
  buildingId?: string;
  periodo?: string;
  vencimiento?: string;
  cashFlow?: CashFlow;
  prorrateo?: Prorrateo;
  egresosPorSeccion?: Record<string, number>;
  aviso?: string;
}

export interface Building {
  id: string;
  slug: string;
  name: string;
  address: string;
  adminCompany?: string;
  cuit?: string;
  createdAt?: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  sueldos: "oklch(0.65 0.2 250)",
  "cargas-sociales": "oklch(0.6 0.18 280)",
  "servicios-publicos": "oklch(0.7 0.18 160)",
  "abonos-servicios": "oklch(0.65 0.15 120)",
  mantenimiento: "oklch(0.7 0.2 30)",
  reparaciones: "oklch(0.6 0.22 15)",
  "gastos-bancarios": "oklch(0.55 0.08 250)",
  "seguros-gastos": "oklch(0.6 0.15 310)",
  administracion: "oklch(0.7 0.12 60)",
  impuestos: "oklch(0.65 0.18 45)",
  ascensores: "oklch(0.6 0.15 200)",
  limpieza: "oklch(0.7 0.15 140)",
  extraordinarias: "oklch(0.6 0.2 340)",
  "fondo-reserva": "oklch(0.65 0.12 90)",
  otros: "oklch(0.55 0.05 240)",
};

export function getCategoryColor(cat: string): string {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  // Fallback: neutral gray
  return "oklch(0.6 0.02 240)";
}
