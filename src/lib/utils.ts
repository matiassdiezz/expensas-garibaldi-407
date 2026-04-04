import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ExpenseCategory, MonthData } from "@/types/expense";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function getCategoryTotals(data: MonthData[]): Record<ExpenseCategory, number> {
  const totals = {} as Record<ExpenseCategory, number>;
  for (const month of data) {
    for (const item of month.items) {
      totals[item.category] = (totals[item.category] || 0) + item.amount;
    }
  }
  return totals;
}

export function getMonthCategoryTotal(month: MonthData, category: ExpenseCategory): number {
  return month.items
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getMonthOverMonthChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
