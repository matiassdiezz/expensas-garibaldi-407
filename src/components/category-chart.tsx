"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthData, CATEGORY_LABELS, CATEGORY_COLORS, ExpenseCategory } from "@/types/expense";
import { formatCurrency, getCategoryTotals } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryChartProps {
  data: MonthData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const categoryTotals = getCategoryTotals(data);

  const chartData = Object.entries(categoryTotals)
    .map(([category, total]) => ({
      name: CATEGORY_LABELS[category as ExpenseCategory],
      total,
      color: CATEGORY_COLORS[category as ExpenseCategory],
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gasto por Categoría (acumulado)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] sm:h-[300px] overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" horizontal={false} />
              <XAxis
                type="number"
                stroke="oklch(0.7 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="oklch(0.7 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                contentStyle={{
                  backgroundColor: "oklch(0.205 0 0)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "oklch(0.9 0 0)",
                }}
                labelStyle={{ color: "oklch(0.7 0 0)" }}
                itemStyle={{ color: "oklch(0.9 0 0)" }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
