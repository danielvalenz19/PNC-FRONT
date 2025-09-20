"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

interface AuditFiltersProps {
  onFiltersChange: (filters: AuditFilters) => void
}

export interface AuditFilters {
  actor?: string
  action?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

const actionOptions = [
  { value: "", label: "Todas las acciones" },
  { value: "login", label: "Inicio de sesión" },
  { value: "logout", label: "Cierre de sesión" },
  { value: "incident_create", label: "Crear incidente" },
  { value: "incident_ack", label: "Reconocer incidente" },
  { value: "incident_assign", label: "Asignar incidente" },
  { value: "incident_status_change", label: "Cambiar estado incidente" },
  { value: "incident_note_add", label: "Agregar nota incidente" },
  { value: "unit_create", label: "Crear unidad" },
  { value: "unit_update", label: "Actualizar unidad" },
  { value: "unit_delete", label: "Eliminar unidad" },
  { value: "settings_update", label: "Actualizar configuración" },
  { value: "simulation_create", label: "Crear simulación" },
  { value: "simulation_update", label: "Actualizar simulación" },
]

export function AuditFilters({ onFiltersChange }: AuditFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<AuditFilters>({
    actor: searchParams.get("actor") || "",
    action: searchParams.get("action") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    page: 1,
    limit: 20,
  })

  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)

    // Update URL params
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== "" && k !== "page" && k !== "limit") {
        params.set(k, v.toString())
      }
    })

    router.push(`/audit?${params.toString()}`)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: AuditFilters = { page: 1, limit: 20 }
    setFilters(clearedFilters)
    router.push("/audit")
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = filters.actor || filters.action || filters.from || filters.to

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="font-medium">Filtros de Auditoría</span>
            {hasActiveFilters && (
              <Badge variant="outline" className="ml-2">
                Filtros activos
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-1" />
              {showFilters ? "Ocultar" : "Mostrar"}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Quick search */}
        <div className="mb-4">
          <Input
            placeholder="Buscar por usuario..."
            value={filters.actor || ""}
            onChange={(e) => handleFilterChange("actor", e.target.value)}
            className="bg-input/40 backdrop-blur-sm"
          />
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.actor && (
              <Badge variant="outline">
                Usuario: {filters.actor}
                <button
                  onClick={() => handleFilterChange("actor", "")}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.action && (
              <Badge variant="outline">
                Acción: {actionOptions.find((a) => a.value === filters.action)?.label}
                <button
                  onClick={() => handleFilterChange("action", "")}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.from && (
              <Badge variant="outline">
                Desde: {new Date(filters.from).toLocaleDateString("es-ES")}
                <button
                  onClick={() => handleFilterChange("from", "")}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.to && (
              <Badge variant="outline">
                Hasta: {new Date(filters.to).toLocaleDateString("es-ES")}
                <button
                  onClick={() => handleFilterChange("to", "")}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/25">
            <div className="space-y-2">
              <Label htmlFor="action">Acción</Label>
              <Select value={filters.action || ""} onValueChange={(value) => handleFilterChange("action", value)}>
                <SelectTrigger className="bg-input/40 backdrop-blur-sm">
                  <SelectValue placeholder="Seleccionar acción" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/25">
                  {actionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">Fecha desde</Label>
              <Input
                id="from"
                type="date"
                value={filters.from || ""}
                onChange={(e) => handleFilterChange("from", e.target.value)}
                className="bg-input/40 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">Fecha hasta</Label>
              <Input
                id="to"
                type="date"
                value={filters.to || ""}
                onChange={(e) => handleFilterChange("to", e.target.value)}
                className="bg-input/40 backdrop-blur-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
