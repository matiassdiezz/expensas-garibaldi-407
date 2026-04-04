export type ExpenseCategory =
  | "personal"
  | "servicios"
  | "mantenimiento"
  | "limpieza"
  | "seguros"
  | "administracion"
  | "impuestos"
  | "fondo-reserva"
  | "otros";

export interface ExpenseItem {
  category: ExpenseCategory;
  description: string;
  amount: number;
}

export interface MonthData {
  month: string; // "2025-04"
  label: string; // "Abril 2025"
  items: ExpenseItem[];
  total: number;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  personal: "Personal",
  servicios: "Servicios",
  mantenimiento: "Mantenimiento",
  limpieza: "Limpieza",
  seguros: "Seguros",
  administracion: "Administración",
  impuestos: "Impuestos",
  "fondo-reserva": "Fondo de Reserva",
  otros: "Otros",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  personal: "var(--chart-1)",
  servicios: "var(--chart-2)",
  mantenimiento: "var(--chart-3)",
  limpieza: "var(--chart-4)",
  seguros: "var(--chart-5)",
  administracion: "oklch(0.7 0.12 200)",
  impuestos: "oklch(0.6 0.18 80)",
  "fondo-reserva": "oklch(0.55 0.1 140)",
  otros: "oklch(0.5 0.05 0)",
};
