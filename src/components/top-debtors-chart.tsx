"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";

type TopDebtor = { customerId: string; customerName: string; total: number };

export function TopDebtorsChart({ data }: { data: TopDebtor[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 120)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          type="number"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(value: number) =>
            new Intl.NumberFormat("uz-UZ", {
              notation: "compact",
            }).format(value)
          }
          stroke="var(--border)"
        />
        <YAxis
          type="category"
          dataKey="customerName"
          width={110}
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
          stroke="var(--border)"
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          formatter={(
            value: number | string | readonly (number | string)[] | undefined
          ) => [
            formatMoney(Array.isArray(value) ? (value[0] ?? 0) : (value ?? 0)),
            "Qarzdorlik",
          ]}
        />
        <Bar dataKey="total" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
