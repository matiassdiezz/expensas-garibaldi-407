"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MonthData, CATEGORY_LABELS, ExpenseCategory } from "@/types/expense";
import {
  formatCurrency,
  formatPercent,
  getMonthOverMonthChange,
  getMonthCategoryTotal,
} from "@/lib/utils";

interface ExpenseTableProps {
  data: MonthData[];
}

export function ExpenseTable({ data }: ExpenseTableProps) {
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  const toggle = (month: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalle por Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...data].reverse().map((month) => {
            const i = data.indexOf(month);
            const prevMonth = i > 0 ? data[i - 1] : null;
            const change = prevMonth
              ? getMonthOverMonthChange(month.total, prevMonth.total)
              : 0;
            const isOpen = openMonths.has(month.month);

            // Detectar anomalías por categoría
            const anomalies: { category: ExpenseCategory; change: number }[] = [];
            if (prevMonth) {
              const categories = new Set(month.items.map((item) => item.category));
              for (const cat of categories) {
                const current = getMonthCategoryTotal(month, cat);
                const previous = getMonthCategoryTotal(prevMonth, cat);
                const catChange = getMonthOverMonthChange(current, previous);
                if (catChange > 30) {
                  anomalies.push({ category: cat, change: catChange });
                }
              }
            }

            return (
              <Collapsible
                key={month.month}
                open={isOpen}
                onOpenChange={() => toggle(month.month)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{month.label}</span>
                      {anomalies.length > 0 && (
                        <Badge variant="destructive" className="text-xs hidden sm:inline-flex">
                          {anomalies.length} anomalía{anomalies.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {prevMonth && (
                        <Badge
                          variant={change > 10 ? "destructive" : "secondary"}
                          className="text-xs font-mono"
                        >
                          {formatPercent(change)}
                        </Badge>
                      )}
                      <span className="text-xs sm:text-sm font-bold font-mono">
                        {formatCurrency(month.total)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border border-t-0 border-border rounded-b-lg overflow-x-auto">
                    <Table className="table-fixed w-full min-w-[480px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[110px]">Categoría</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right w-[90px]">Monto</TableHead>
                          {prevMonth && (
                            <TableHead className="text-right w-[60px]">Var.</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {month.items.map((item, j) => {
                          const prevCatTotal = prevMonth
                            ? getMonthCategoryTotal(prevMonth, item.category)
                            : 0;
                          const currentCatTotal = getMonthCategoryTotal(month, item.category);
                          const itemIsAnomaly =
                            prevMonth &&
                            prevCatTotal > 0 &&
                            getMonthOverMonthChange(currentCatTotal, prevCatTotal) > 30;

                          return (
                            <TableRow
                              key={j}
                              className={itemIsAnomaly ? "bg-destructive/10" : ""}
                            >
                              <TableCell className="text-xs text-muted-foreground">
                                {CATEGORY_LABELS[item.category]}
                              </TableCell>
                              <TableCell className="text-sm break-words">
                                {item.description}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(item.amount)}
                              </TableCell>
                              {prevMonth && (
                                <TableCell className="text-right">
                                  {/* Show category-level var for first item in category */}
                                  {j === 0 ||
                                  month.items[j - 1]?.category !== item.category ? (
                                    prevCatTotal > 0 ? (
                                      <span
                                        className={`text-xs font-mono ${
                                          getMonthOverMonthChange(
                                            currentCatTotal,
                                            prevCatTotal
                                          ) > 30
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {formatPercent(
                                          getMonthOverMonthChange(
                                            currentCatTotal,
                                            prevCatTotal
                                          )
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        nuevo
                                      </span>
                                    )
                                  ) : null}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
