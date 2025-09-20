"use client"

import { useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { UnitStats } from "@/components/units/unit-stats"
import { UnitList } from "@/components/units/unit-list"
import { UnitForm } from "@/components/units/unit-form"

interface Unit {
  id: number
  name: string
  type: string
  plate?: string
  status: string
  active: boolean
  lat?: number
  lng?: number
  last_seen?: string
}

export default function UnitsPage() {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEditUnit = (unit: Unit) => {
    setSelectedUnit(unit)
    setShowForm(true)
  }

  const handleCreateUnit = () => {
    setSelectedUnit(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedUnit(null)
  }

  const handleFormSave = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <RouteGuard allowedRoles={["admin", "operator", "supervisor"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white text-balance">Gestión de Unidades</h1>
            <p className="text-white/70">Administra las unidades de respuesta del sistema</p>
          </div>

          <UnitStats refreshTrigger={refreshTrigger} />

          <UnitList onEditUnit={handleEditUnit} onCreateUnit={handleCreateUnit} refreshTrigger={refreshTrigger} />

          <UnitForm unit={selectedUnit} open={showForm} onClose={handleFormClose} onSave={handleFormSave} />
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
