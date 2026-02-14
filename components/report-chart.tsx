"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card } from "@/components/ui/card"

export type ChartDatum = {
  name: string
  value: number
}

export function ReportChart({ data }: { data: ChartDatum[] }) {
  return (
    <Card className="h-80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={32}
          />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="value" fill="hsl(var(--brand))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
