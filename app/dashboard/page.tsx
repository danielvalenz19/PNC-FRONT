"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { IncidentQueue } from "@/components/dashboard/incident-queue"
import { IncidentMap } from "@/components/dashboard/incident-map"

export default function DashboardPage() {
  return (
    <RouteGuard allowedRoles={["admin", "operator", "supervisor"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white text-balance">Dashboard</h1>
            <p className="text-white/70">Monitoreo en tiempo real del sistema de emergencias</p>
          </div>

          <StatsCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncidentQueue />
            <IncidentMap />
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
