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
} from "recharts";

interface MonthlyChartProps {
  data: MonthData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((m) => ({
    name: m.label.split(" ")[0],
    total: m.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolución Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Total"]}
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
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={{ fill: "var(--chart-1)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
