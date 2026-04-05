export type ExpenseCategory =
  | "sueldos"
  | "cargas-sociales"
  | "servicios-publicos"
  | "abonos-servicios"
  | "mantenimiento"
  | "reparaciones"
  | "gastos-bancarios"
  | "seguros-gastos"
  | "administracion";

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
  ufDiez: number; // Total a pagar UF 26 (DIEZ, Gonzalo) — 6.4%
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  sueldos: "A · Sueldos",
  "cargas-sociales": "B · Cargas Sociales",
  "servicios-publicos": "C · Servicios Públicos",
  "abonos-servicios": "D · Abonos y Servicios",
  mantenimiento: "E · Mantenimiento",
  reparaciones: "F · Reparaciones UF",
  "gastos-bancarios": "G · Gastos Bancarios",
  "seguros-gastos": "H · Seguros y Gastos",
  administracion: "I · Administración",
};

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
  periodo?: string;
  vencimiento?: string;
  cashFlow?: CashFlow;
  prorrateo?: Prorrateo;
  egresosPorSeccion?: Record<string, number>;
  aviso?: string;
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  sueldos: "oklch(0.65 0.2 250)",
  "cargas-sociales": "oklch(0.6 0.18 280)",
  "servicios-publicos": "oklch(0.7 0.18 160)",
  "abonos-servicios": "oklch(0.65 0.15 120)",
  mantenimiento: "oklch(0.7 0.2 30)",
  reparaciones: "oklch(0.6 0.22 15)",
  "gastos-bancarios": "oklch(0.55 0.08 250)",
  "seguros-gastos": "oklch(0.6 0.15 310)",
  administracion: "oklch(0.7 0.12 60)",
};
