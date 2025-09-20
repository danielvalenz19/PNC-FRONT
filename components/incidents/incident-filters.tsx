"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { IncidentStatus } from "@/lib/config"
import { Search, Filter, X } from "lucide-react"

interface IncidentFiltersProps {
  onFiltersChange: (filters: IncidentFilters) => void
}

export interface IncidentFilters {
  status?: IncidentStatus
  from?: string
  to?: string
  q?: string
  page?: number
  limit?: number
}

const statusOptions: { value: IncidentStatus | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "NEW", label: "Nuevo" },
  { value: "ACK", label: "Reconocido" },
  { value: "DISPATCHED", label: "Despachado" },
  { value: "IN_PROGRESS", label: "En Progreso" },
  { value: "CLOSED", label: "Cerrado" },
  { value: "CANCELED", label: "Cancelado" },
]

export function IncidentFilters({ onFiltersChange }: IncidentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<IncidentFilters>({
    status: (searchParams.get("status") as IncidentStatus) || undefined,
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    q: searchParams.get("q") || "",
    page: 1,
    limit: 20,
  })

  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: keyof IncidentFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)

    // Update URL params
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== "" && k !== "page" && k !== "limit") {
        params.set(k, v.toString())
      }
    })

    router.push(`/incidents?${params.toString()}`)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: IncidentFilters = { page: 1, limit: 20 }
    setFilters(clearedFilters)
    router.push("/incidents")
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = filters.status || filters.from || filters.to || filters.q

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case "NEW":
        return "bg-red-500/20 text-red-700 border-red-500/30"
      case "ACK":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
      case "DISPATCHED":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30"
      case "IN_PROGRESS":
        return "bg-purple-500/20 text-purple-700 border-purple-500/30"
      case "CLOSED":
        return "bg-green-500/20 text-green-700 border-green-500/30"
      case "CANCELED":
        return "bg-gray-500/20 text-gray-700 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30"
    }
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="font-medium">Filtros</span>
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
            placeholder="Buscar incidentes..."
            value={filters.q || ""}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            className="bg-input/40 backdrop-blur-sm"
          />
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.status && (
              <Badge variant="outline" className={getStatusColor(filters.status)}>
                Estado: {statusOptions.find((s) => s.value === filters.status)?.label}
                <button
                  onClick={() => handleFilterChange("status", undefined)}
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
              <Label htmlFor="status">Estado</Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange("status", value || undefined)}
              >
                <SelectTrigger className="bg-input/40 backdrop-blur-sm">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/25">
                  {statusOptions.map((option) => (
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
