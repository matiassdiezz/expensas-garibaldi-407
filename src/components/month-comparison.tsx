"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthData, CATEGORY_LABELS, ExpenseCategory } from "@/types/expense";
import { formatCurrency, formatPercent, getMonthCategoryTotal, getMonthOverMonthChange } from "@/lib/utils";

interface MonthComparisonProps {
  data: MonthData[];
}

export function MonthComparison({ data }: MonthComparisonProps) {
  const [monthA, setMonthA] = useState(data.length > 1 ? data[data.length - 2].month : data[0].month);
  const [monthB, setMonthB] = useState(data[data.length - 1].month);

  const dataA = data.find((m) => m.month === monthA);
  const dataB = data.find((m) => m.month === monthB);

  if (!dataA || !dataB) return null;

  // Get all categories present in either month
  const allCategories = new Set<ExpenseCategory>();
  for (const item of [...dataA.items, ...dataB.items]) {
    allCategories.add(item.category);
  }

  const comparison = Array.from(allCategories)
    .map((cat) => {
      const totalA = getMonthCategoryTotal(dataA, cat);
      const totalB = getMonthCategoryTotal(dataB, cat);
      const change = getMonthOverMonthChange(totalB, totalA);
      return { category: cat, totalA, totalB, change, diff: totalB - totalA };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const totalChange = getMonthOverMonthChange(dataB.total, dataA.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparador</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={monthA} onValueChange={(v) => v && setMonthA(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.map((m) => (
                <SelectItem key={m.month} value={m.month}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground self-center text-sm">vs</span>
          <Select value={monthB} onValueChange={(v) => v && setMonthB(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.map((m) => (
                <SelectItem key={m.month} value={m.month}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="grid grid-cols-[1fr_80px_80px_70px] gap-1 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
              <span>Categoría</span>
              <span className="text-right">{dataA.label.split(" ")[0]}</span>
              <span className="text-right">{dataB.label.split(" ")[0]}</span>
              <span className="text-right">Var.</span>
            </div>
            {comparison.map((row) => (
              <div
                key={row.category}
                className={`grid grid-cols-[1fr_80px_80px_70px] gap-1 p-3 border-t border-border text-sm ${
                  Math.abs(row.change) > 30 ? "bg-destructive/5" : ""
                }`}
              >
                <span className="text-muted-foreground text-xs">
                  {CATEGORY_LABELS[row.category]}
                </span>
                <span className="text-right font-mono text-xs">
                  {formatCurrency(row.totalA)}
                </span>
                <span className="text-right font-mono text-xs">
                  {formatCurrency(row.totalB)}
                </span>
                <span className="text-right">
                  {row.totalA > 0 ? (
                    <Badge
                      variant={row.change > 30 ? "destructive" : "secondary"}
                      className="text-xs font-mono"
                    >
                      {formatPercent(row.change)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">nuevo</span>
                  )}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_80px_80px_70px] gap-1 p-3 border-t border-border bg-muted/30 font-medium">
              <span className="text-xs sm:text-sm">Total</span>
              <span className="text-right font-mono text-[11px] sm:text-sm">
                {formatCurrency(dataA.total)}
              </span>
              <span className="text-right font-mono text-[11px] sm:text-sm">
                {formatCurrency(dataB.total)}
              </span>
              <span className="text-right">
                <Badge
                  variant={totalChange > 10 ? "destructive" : "secondary"}
                  className="text-[10px] sm:text-xs font-mono"
                >
                  {formatPercent(totalChange)}
                </Badge>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
