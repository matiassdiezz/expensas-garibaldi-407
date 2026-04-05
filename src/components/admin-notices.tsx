"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getMonthOverMonthChange, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { LiquidacionFull } from "@/types/expense";

export function AdminNotices({ data }: { data: LiquidacionFull[] }) {
  const notices = data
    .filter((d) => d.aviso)
    .map((d) => ({
      month: d.month,
      label: d.periodo ?? d.label,
      text: d.aviso!,
    }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          ¿Qué dijo la administración?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Avisos extraídos de las liquidaciones oficiales
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...notices].reverse().map((notice) => {
            const monthData = data.find(
              (m) => m.month === notice.month
            );
            const monthIndex = data.findIndex(
              (m) => m.month === notice.month
            );
            const prevMonth =
              monthIndex > 0 ? data[monthIndex - 1] : null;
            const expensaChange =
              prevMonth && monthData
                ? getMonthOverMonthChange(
                    monthData.expensasA,
                    prevMonth.expensasA
                  )
                : null;

            return (
              <div
                key={notice.month}
                className="border-l-2 border-muted pl-4 py-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{notice.label}</span>
                  {monthData && (
                    <span className="text-xs text-muted-foreground font-mono">
                      Exp A: {formatCurrency(monthData.expensasA)}
                    </span>
                  )}
                  {expensaChange !== null && expensaChange !== 0 && (
                    <Badge
                      variant={
                        expensaChange > 0 ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {formatPercent(expensaChange)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{notice.text}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
