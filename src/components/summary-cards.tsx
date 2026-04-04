"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthData } from "@/types/expense";
import { formatCurrency, formatPercent, getMonthOverMonthChange } from "@/lib/utils";

interface SummaryCardsProps {
  data: MonthData[];
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const totalAnual = data.reduce((sum, m) => sum + m.total, 0);
  const promedio = totalAnual / data.length;

  const mesMasCaro = data.reduce((max, m) => (m.total > max.total ? m : max), data[0]);

  // Variación máxima mes a mes
  let maxVariacion = 0;
  let maxVariacionLabel = "";
  for (let i = 1; i < data.length; i++) {
    const change = getMonthOverMonthChange(data[i].total, data[i - 1].total);
    if (Math.abs(change) > Math.abs(maxVariacion)) {
      maxVariacion = change;
      maxVariacionLabel = `${data[i - 1].label.split(" ")[0]} → ${data[i].label.split(" ")[0]}`;
    }
  }

  // Variación primer mes vs último
  const variacionTotal =
    data.length > 1
      ? getMonthOverMonthChange(data[data.length - 1].total, data[0].total)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Acumulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{formatCurrency(totalAnual)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.length} meses analizados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Promedio Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{formatCurrency(promedio)}</div>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant={variacionTotal > 0 ? "destructive" : "secondary"} className="text-xs">
              {formatPercent(variacionTotal)}
            </Badge>
            <span className="text-xs text-muted-foreground">primer → último mes</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Mes Más Caro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{formatCurrency(mesMasCaro.total)}</div>
          <p className="text-xs text-muted-foreground mt-1">{mesMasCaro.label}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Mayor Variación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            <span className={maxVariacion > 20 ? "text-destructive" : ""}>
              {formatPercent(maxVariacion)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{maxVariacionLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
