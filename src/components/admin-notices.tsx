"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import liquidacionesRaw from "@/lib/liquidaciones.json";
import { expensasData } from "@/lib/data";
import { formatCurrency, getMonthOverMonthChange, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const liquidaciones = liquidacionesRaw.liquidaciones as Array<{
  liquidacion: string;
  periodo: string;
  aviso: string | null;
}>;

const notices = liquidaciones
  .filter((l) => l.aviso)
  .map((l) => ({
    month: l.liquidacion,
    label: l.periodo,
    text: l.aviso!,
  }));

export function AdminNotices() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Comunicados de la Administración
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Avisos textuales extraídos de cada liquidación oficial
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...notices].reverse().map((notice) => {
            const monthData = expensasData.find(
              (m) => m.month === notice.month
            );
            const monthIndex = expensasData.findIndex(
              (m) => m.month === notice.month
            );
            const prevMonth =
              monthIndex > 0 ? expensasData[monthIndex - 1] : null;
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
