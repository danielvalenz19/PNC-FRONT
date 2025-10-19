"use client"

import { useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { DateRangePicker } from "@/components/reports/date-range-picker"
import { KPICards } from "@/components/reports/kpi-cards"
import { ResponseTimeChart } from "@/components/reports/response-time-chart"
import { IncidentsByStatusChart } from "@/components/reports/incidents-by-status-chart"
import { IncidentsVolumeChart } from "@/components/reports/incidents-volume-chart"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30) // Default to last 30 days

    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    }
  })

  return (
    <RouteGuard allowedRoles={["admin", "operator", "supervisor"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">Reportes y KPIs</h1>
            <p className="text-muted-foreground">Análisis de rendimiento y métricas del sistema</p>
          </div>

          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

          <KPICards dateRange={dateRange} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponseTimeChart dateRange={dateRange} />
            <IncidentsByStatusChart dateRange={dateRange} />
          </div>

          <IncidentsVolumeChart dateRange={dateRange} />
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
