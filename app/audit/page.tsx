"use client"

import { useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AuditFilters, type AuditFilters as IAuditFilters } from "@/components/audit/audit-filters"
import { AuditList } from "@/components/audit/audit-list"
import { AuditStats } from "@/components/audit/audit-stats"
import { TopActivities } from "@/components/audit/top-activities"

export default function AuditPage() {
  const [filters, setFilters] = useState<IAuditFilters>({
    page: 1,
    limit: 20,
  })

  // Create date range for stats (last 7 days)
  const statsDateRange = (() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 7)

    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    }
  })()

  return (
    <RouteGuard allowedRoles={["admin", "supervisor"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white text-balance">Auditoría del Sistema</h1>
            <p className="text-white/70">Registro completo de actividades y eventos de seguridad</p>
          </div>

          <AuditStats dateRange={statsDateRange} />

          <TopActivities dateRange={statsDateRange} />

          <AuditFilters onFiltersChange={setFilters} />

          <AuditList filters={filters} />
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
