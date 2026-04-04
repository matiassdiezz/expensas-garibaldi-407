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
import { LiquidacionDetail } from "@/components/liquidacion-detail";
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
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | null>(
    null
  );

  const categories = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

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
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Detalle por Mes</CardTitle>
          <Select
            value={categoryFilter ?? "all"}
            onValueChange={(v) =>
              setCategoryFilter(
                v === "all" ? null : (v as ExpenseCategory)
              )
            }
          >
            <SelectTrigger className="w-[140px] sm:w-[220px] h-8 text-xs">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...data].reverse().map((month) => {
            const i = data.indexOf(month);
            const prevMonth = i > 0 ? data[i - 1] : null;

            const filteredItems = month.items.filter(
              (item) =>
                !categoryFilter || item.category === categoryFilter
            );

            // Totales según filtro
            const displayTotal = categoryFilter
              ? getMonthCategoryTotal(month, categoryFilter)
              : month.total;
            const prevDisplayTotal = prevMonth
              ? categoryFilter
                ? getMonthCategoryTotal(prevMonth, categoryFilter)
                : prevMonth.total
              : 0;
            const change =
              prevMonth && prevDisplayTotal > 0
                ? getMonthOverMonthChange(displayTotal, prevDisplayTotal)
                : 0;
            const isOpen = openMonths.has(month.month);

            // Detectar anomalías por categoría
            const anomalies: {
              category: ExpenseCategory;
              change: number;
            }[] = [];
            if (prevMonth) {
              const cats = categoryFilter
                ? [categoryFilter]
                : Array.from(
                    new Set(month.items.map((item) => item.category))
                  );
              for (const cat of cats) {
                const current = getMonthCategoryTotal(month, cat);
                const previous = getMonthCategoryTotal(prevMonth, cat);
                const catChange = getMonthOverMonthChange(
                  current,
                  previous
                );
                if (catChange > 30) {
                  anomalies.push({ category: cat, change: catChange });
                }
              }
            }

            // Skip months with no items for this category
            if (categoryFilter && displayTotal === 0) return null;

            return (
              <Collapsible
                key={month.month}
                open={isOpen}
                onOpenChange={() => toggle(month.month)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                        {month.label}
                      </span>
                      {anomalies.length > 0 && (
                        <Badge
                          variant="destructive"
                          className="text-xs hidden sm:inline-flex"
                        >
                          {anomalies.length} anomalía
                          {anomalies.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {prevMonth && prevDisplayTotal > 0 && (
                        <Badge
                          variant={
                            change > 10 ? "destructive" : "secondary"
                          }
                          className="text-xs font-mono"
                        >
                          {formatPercent(change)}
                        </Badge>
                      )}
                      <span className="text-xs sm:text-sm font-bold font-mono">
                        {formatCurrency(displayTotal)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border border-t-0 border-border rounded-b-lg">
                    {/* Mobile layout: Var → Monto → Descripción → Cat(letra) */}
                    <div className="sm:hidden divide-y divide-border">
                      {filteredItems.map((item, j) => {
                        const prevCatTotal = prevMonth
                          ? getMonthCategoryTotal(
                              prevMonth,
                              item.category
                            )
                          : 0;
                        const currentCatTotal =
                          getMonthCategoryTotal(month, item.category);
                        const itemIsAnomaly =
                          prevMonth &&
                          prevCatTotal > 0 &&
                          getMonthOverMonthChange(
                            currentCatTotal,
                            prevCatTotal
                          ) > 30;
                        const isFirstInCategory =
                          j === 0 ||
                          filteredItems[j - 1]?.category !==
                            item.category;
                        const catChange =
                          prevCatTotal > 0
                            ? getMonthOverMonthChange(
                                currentCatTotal,
                                prevCatTotal
                              )
                            : 0;
                        const catLetter =
                          CATEGORY_LABELS[item.category].charAt(0);

                        return (
                          <div
                            key={j}
                            className={`flex items-start gap-1.5 px-2 py-1.5 ${
                              itemIsAnomaly ? "bg-destructive/10" : ""
                            }`}
                          >
                            {prevMonth && (
                              <div className="w-[38px] shrink-0 text-right pt-px">
                                {isFirstInCategory ? (
                                  prevCatTotal > 0 ? (
                                    <span
                                      className={`text-[10px] font-mono leading-tight ${
                                        catChange > 30
                                          ? "text-destructive"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {formatPercent(catChange)}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">
                                      nuevo
                                    </span>
                                  )
                                ) : null}
                              </div>
                            )}
                            <div className="w-[80px] shrink-0 text-right font-mono text-xs">
                              {formatCurrency(item.amount)}
                            </div>
                            <div className="flex-1 min-w-0 text-xs break-words whitespace-normal">
                              {item.description}
                            </div>
                            <div className="w-[14px] shrink-0 text-center text-[10px] text-muted-foreground font-medium">
                              {catLetter}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Liquidación oficial */}
                    <LiquidacionDetail month={month.month} />

                    {/* Desktop layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table className="table-fixed w-full min-w-[480px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[110px]">
                              Categoría
                            </TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right w-[90px]">
                              Monto
                            </TableHead>
                            {prevMonth && (
                              <TableHead className="text-right w-[60px]">
                                Var.
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item, j) => {
                            const prevCatTotal = prevMonth
                              ? getMonthCategoryTotal(
                                  prevMonth,
                                  item.category
                                )
                              : 0;
                            const currentCatTotal =
                              getMonthCategoryTotal(
                                month,
                                item.category
                              );
                            const itemIsAnomaly =
                              prevMonth &&
                              prevCatTotal > 0 &&
                              getMonthOverMonthChange(
                                currentCatTotal,
                                prevCatTotal
                              ) > 30;
                            const isFirstInCategory =
                              j === 0 ||
                              filteredItems[j - 1]?.category !==
                                item.category;

                            return (
                              <TableRow
                                key={j}
                                className={
                                  itemIsAnomaly
                                    ? "bg-destructive/10"
                                    : ""
                                }
                              >
                                <TableCell className="text-xs text-muted-foreground">
                                  {CATEGORY_LABELS[item.category]}
                                </TableCell>
                                <TableCell className="text-sm break-words whitespace-normal">
                                  {item.description}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  {formatCurrency(item.amount)}
                                </TableCell>
                                {prevMonth && (
                                  <TableCell className="text-right">
                                    {isFirstInCategory ? (
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
