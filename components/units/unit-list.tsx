"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { useSocket } from "@/hooks/use-socket"
import { useAuth } from "@/hooks/use-auth"
import type { UnitStatus } from "@/lib/config"
import { Car, Search, Plus, Edit, MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

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

interface UnitListProps {
  onEditUnit: (unit: Unit) => void
  onCreateUnit: () => void
  refreshTrigger: number
}

export function UnitList({ onEditUnit, onCreateUnit, refreshTrigger }: UnitListProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("available") // Updated default value (backend uses lowercase)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const { hasRole } = useAuth()
  const { on, off, subscribeToOps } = useSocket()

  const loadUnits = async () => {
    try {
      setLoading(true)
      setError(null)

      const response: any = await apiClient.getUnits({
        // backend does not accept CSV; pass single status if using server-side filter
        status: typeof statusFilter === "string" ? statusFilter : undefined,
        // treat 'all' as no type filter
        type: typeFilter === "all" ? undefined : typeFilter || undefined,
      })

      // API returns an array (not paginated). If some code returns { items: [] }, accept both.
  const unitsArr = Array.isArray(response) ? response : (response && response.items ? response.items : [])

      // Normalize coordinates to numbers when present
      const normalized = (unitsArr as any[]).map((u) => ({
        ...u,
        lat: u.lat !== undefined && u.lat !== null ? Number(u.lat) : undefined,
        lng: u.lng !== undefined && u.lng !== null ? Number(u.lng) : undefined,
      }))

      setUnits(normalized)
    } catch (err) {
      setError("Error al cargar unidades")
      console.error("[v0] Failed to load units:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  }, [statusFilter, typeFilter, refreshTrigger])

  useEffect(() => {
    subscribeToOps()

    const handleUnitUpdate = (data: {
      id: number
      status?: string
      lat?: number
      lng?: number
      last_seen?: string
    }) => {
      console.log("[v0] Unit update received:", data)
      setUnits((prev) =>
        prev.map((unit) => {
          if (unit.id === data.id) {
            return {
              ...unit,
              ...(data.status && { status: data.status }),
              ...(data.lat !== undefined && { lat: data.lat }),
              ...(data.lng !== undefined && { lng: data.lng }),
              ...(data.last_seen && { last_seen: data.last_seen }),
            }
          }
          return unit
        }),
      )
    }

  on("units:update", handleUnitUpdate as any)

    return () => {
      off("units:update", handleUnitUpdate as any)
    }
  }, [on, off, subscribeToOps])

  useEffect(() => {
    // Filter units based on search query
    const filtered = units.filter((unit) => {
      const matchesSearch =
        !searchQuery ||
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.plate?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })

    setFilteredUnits(filtered)
  }, [units, searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/20 text-green-700 border-green-500/30"
      case "en_route":
      case "on_site":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
      case "out_of_service":
        return "bg-gray-500/20 text-gray-700 border-gray-500/30"
      case "maintenance":
        return "bg-red-500/20 text-red-700 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "en_route":
      case "on_site":
        return "Ocupada"
      case "out_of_service":
        return "Fuera de línea"
      case "maintenance":
        return "Mantenimiento"
      default:
        return status
    }
  }

  const uniqueTypes = Array.from(new Set(units.map((unit) => unit.type))).filter(Boolean)

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Gestión de Unidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Gestión de Unidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadUnits} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Gestión de Unidades
          <Badge variant="outline" className="ml-2">
            {filteredUnits.length} de {units.length}
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={loadUnits} variant="ghost" size="sm">
            Actualizar
          </Button>
          {hasRole("admin") && (
            <Button onClick={onCreateUnit} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nueva Unidad
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar unidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input/40 backdrop-blur-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="bg-input/40 backdrop-blur-sm">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="glass-card border-border/25">
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="en_route">En Ruta</SelectItem>
              <SelectItem value="on_site">En Sitio</SelectItem>
              <SelectItem value="out_of_service">Fuera de servicio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-input/40 backdrop-blur-sm">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent className="glass-card border-border/25">
              <SelectItem value="all">Todos los tipos</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Units List */}
        {filteredUnits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No se encontraron unidades</p>
            <p className="text-sm">
              {searchQuery || statusFilter || typeFilter
                ? "Intenta ajustar los filtros de búsqueda"
                : "Aún no hay unidades registradas"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors border border-border/25"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{unit.name}</h3>
                    <p className="text-sm text-muted-foreground">{unit.type}</p>
                    {unit.plate && (
                      <div className="mt-1">
                        <span className="text-sm text-muted-foreground">Placa</span>{" "}
                        <span className="inline-block rounded border border-slate-300 bg-white/80 px-2 py-0.5 font-mono text-xs">
                          {unit.plate.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(unit.status)}>
                      {getStatusLabel(unit.status)}
                    </Badge>
                    {!unit.active && (
                      <Badge variant="outline" className="bg-gray-500/20 text-gray-700 border-gray-500/30">
                        Inactiva
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {Number.isFinite(Number(unit.lat)) && Number.isFinite(Number(unit.lng)) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {Number(unit.lat).toFixed(4)}, {Number(unit.lng).toFixed(4)}
                      </span>
                    </div>
                  )}

                  {unit.last_seen && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Última actualización:{" "}
                        {formatDistanceToNow(new Date(unit.last_seen), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {hasRole("admin") && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => onEditUnit(unit)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
