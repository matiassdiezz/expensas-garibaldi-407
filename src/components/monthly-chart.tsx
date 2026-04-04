"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthData } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
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
        <CardContent>
          <div className="h-[220px] sm:h-[300px] overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -10, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.7 0 0)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={45}
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
                  wrapperStyle={{ fontSize: "11px" }}
                />
                <Bar
                  dataKey="egresos"
                  name="Egresos"
                  fill="oklch(0.6 0.2 15)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expensasA"
                  name="Exp. A cobradas"
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
        <CardContent>
          <div className="h-[160px] sm:h-[200px] overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -10, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.7 0 0)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
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
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.7 0.2 160)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
