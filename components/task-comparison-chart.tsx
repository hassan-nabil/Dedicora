"use client"

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card } from "@/components/ui/card"

export type ComparisonDatum = {
  name: string
  estimated: number
  actual: number
}

/**
 * Grouped bar chart comparing estimated vs actual minutes per task.
 * Green actual bars = finished under estimate, red = over.
 */
export function TaskComparisonChart({ data }: { data: ComparisonDatum[] }) {
  if (!data.length) return null

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Estimated vs Actual (minutes)
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              interval="preserveStartEnd"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={36}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "min",
                position: "insideTopLeft",
                offset: 0,
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(value?: number, name?: string) => [
                `${(value ?? 0).toFixed(1)} min`,
                name === "estimated" ? "Estimated" : "Actual",
              ]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend
              formatter={(value: string) =>
                value === "estimated" ? "Estimated" : "Actual"
              }
            />
            <Bar
              dataKey="estimated"
              fill="hsl(var(--brand))"
              radius={[6, 6, 0, 0]}
              barSize={24}
            />
            <Bar
              dataKey="actual"
              fill="hsl(142 71% 45%)"
              radius={[6, 6, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
