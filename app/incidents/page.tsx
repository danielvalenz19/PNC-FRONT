"use client"

import { useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { IncidentFilters, type IncidentFilters as IIncidentFilters } from "@/components/incidents/incident-filters"
import { IncidentList } from "@/components/incidents/incident-list"

export default function IncidentsPage() {
  const [filters, setFilters] = useState<IIncidentFilters>({
    page: 1,
    limit: 20,
  })

  return (
    <RouteGuard allowedRoles={["admin", "operator", "supervisor"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white text-balance">Gestión de Incidentes</h1>
            <p className="text-white/70">Administra y monitorea todos los incidentes del sistema</p>
          </div>

          <IncidentFilters onFiltersChange={setFilters} />
          <IncidentList filters={filters} />
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
