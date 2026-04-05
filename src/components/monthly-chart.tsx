"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiquidacionFull } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { useMobile } from "@/lib/use-mobile";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyChartProps {
  data: LiquidacionFull[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const isMobile = useMobile();

  const chartData = data.map((m) => {
    const [mes, anio] = m.label.split(" ");
    const short = mes.slice(0, 3);
    return {
      name: `${short} ${anio.slice(2)}`,
      egresos: m.total,
      expensas: m.expensasA,
      caja: m.cashFlow?.saldoFinal ?? null,
    };
  });

  return (
    <section id="section-evolucion" className="scroll-mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Egresos vs Expensas vs Caja</CardTitle>
          <p className="text-xs text-muted-foreground">
            Evolución mensual — lo que se gasta, lo que se cobra, y lo que queda en el banco
          </p>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-[260px] min-w-0 sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 8,
                  right: isMobile ? 16 : 20,
                  bottom: isMobile ? 8 : 4,
                  left: isMobile ? 4 : 4,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 9 : 11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  interval={isMobile ? 1 : 0}
                />
                <YAxis
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 9 : 10}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={isMobile ? 34 : 45}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value))]}
                  contentStyle={{
                    backgroundColor: "oklch(0.205 0 0)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  labelStyle={{ color: "oklch(0.7 0 0)" }}
                />
                <Legend
                  iconSize={isMobile ? 8 : 10}
                  wrapperStyle={{
                    fontSize: isMobile ? "10px" : "11px",
                    paddingTop: isMobile ? "8px" : "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="egresos"
                  name="Egresos"
                  stroke="oklch(0.6 0.2 15)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.6 0.2 15)", r: isMobile ? 2.5 : 3.5 }}
                  activeDot={{ r: isMobile ? 4 : 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expensas"
                  name="Expensas cobradas"
                  stroke="oklch(0.65 0.15 250)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.65 0.15 250)", r: isMobile ? 2.5 : 3.5 }}
                  activeDot={{ r: isMobile ? 4 : 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="caja"
                  name="Saldo en caja"
                  stroke="oklch(0.7 0.2 160)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ fill: "oklch(0.7 0.2 160)", r: isMobile ? 2.5 : 3.5 }}
                  activeDot={{ r: isMobile ? 4 : 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
