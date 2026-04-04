"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthData } from "@/types/expense";
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
  BarChart,
  Bar,
} from "recharts";

interface MonthlyChartProps {
  data: MonthData[];
  unitPercent: number;
}

export function MonthlyChart({ data, unitPercent }: MonthlyChartProps) {
  const isMobile = useMobile();

  // Últimos 6 meses — los más recientes siempre visibles
  const recent = data.slice(-6);
  const chartData = recent.map((m) => ({
    name: m.label.split(" ")[0].slice(0, 3),
    egresos: m.total,
    expensasA: m.expensasA,
    tuExpensa: Math.round(m.expensasA * (unitPercent / 100)),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Egresos vs Expensas Cobradas</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-[220px] min-w-0 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barCategoryGap={isMobile ? "18%" : "24%"}
                margin={{
                  top: 8,
                  right: isMobile ? 16 : 12,
                  bottom: isMobile ? 32 : 8,
                  left: isMobile ? 4 : 4,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 10 : 11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  padding={{ left: isMobile ? 8 : 15, right: isMobile ? 8 : 15 }}
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
                <Bar
                  dataKey="egresos"
                  name="Egresos"
                  fill="oklch(0.6 0.2 15)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expensasA"
                  name={isMobile ? "Exp. A" : "Exp. A cobradas"}
                  fill="oklch(0.65 0.15 250)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu Expensa ({unitPercent}%)</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-[160px] min-w-0 sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 8,
                  right: isMobile ? 16 : 12,
                  bottom: isMobile ? 8 : 4,
                  left: isMobile ? 4 : 4,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  padding={{ left: isMobile ? 8 : 15, right: isMobile ? 8 : 15 }}
                />
                <YAxis
                  stroke="oklch(0.7 0 0)"
                  fontSize={isMobile ? 9 : 11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={isMobile ? 34 : 44}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Tu expensa"]}
                  contentStyle={{
                    backgroundColor: "oklch(0.205 0 0)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  labelStyle={{ color: "oklch(0.7 0 0)" }}
                />
                <Line
                  type="monotone"
                  dataKey="tuExpensa"
                  name="Tu expensa"
                  stroke="oklch(0.7 0.2 160)"
                  strokeWidth={isMobile ? 2.25 : 2.5}
                  dot={{ fill: "oklch(0.7 0.2 160)", r: isMobile ? 3 : 4 }}
                  activeDot={{ r: isMobile ? 5 : 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
