"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/hooks/use-socket"
import type { IncidentStatus } from "@/lib/config"
import type { IncidentFilters } from "./incident-filters"
import { AlertTriangle, Clock, MapPin, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Incident {
  id: string
  created_at: string
  status: IncidentStatus
  lat: number
  lng: number
  accuracy?: number
  priority?: number
  battery?: number
}

interface IncidentListProps {
  filters: IncidentFilters
}

export function IncidentList({ filters }: IncidentListProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const { on, off, subscribeToOps } = useSocket()

  const loadIncidents = async (currentFilters: IncidentFilters) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.getIncidents({
        status: currentFilters.status,
        from: currentFilters.from,
        to: currentFilters.to,
        q: currentFilters.q,
        page: currentFilters.page || 1,
        limit: currentFilters.limit || 20,
      })

      setIncidents(response.items)
      setPagination({
        page: response.page,
        total: response.total,
        totalPages: Math.ceil(response.total / (currentFilters.limit || 20)),
      })
    } catch (err) {
      setError("Error al cargar incidentes")
      console.error("[v0] Failed to load incidents:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents(filters)
  }, [filters])

  useEffect(() => {
    subscribeToOps()

    const handleNewIncident = (data: {
      id: string
      lat: number
      lng: number
      created_at: string
      status: "NEW"
    }) => {
      const newIncident: Incident = {
        ...data,
        priority: 1,
      }

      // Only add if it matches current filters
      if (!filters.status || filters.status === "NEW") {
        setIncidents((prev) => [newIncident, ...prev.slice(0, (filters.limit || 20) - 1)])
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }))
      }
    }

    const handleIncidentUpdate = (data: {
      id: string
      patch: {
        status?: IncidentStatus
        location?: { lat: number; lng: number }
      }
    }) => {
      setIncidents(
        (prev) =>
          prev
            .map((incident) => {
              if (incident.id === data.id) {
                const updated = {
                  ...incident,
                  ...(data.patch.status && { status: data.patch.status }),
                  ...(data.patch.location && {
                    lat: data.patch.location.lat,
                    lng: data.patch.location.lng,
                  }),
                }

                // Remove from list if status no longer matches filter
                if (filters.status && data.patch.status && data.patch.status !== filters.status) {
                  return null
                }

                return updated
              }
              return incident
            })
            .filter(Boolean) as Incident[],
      )
    }

    on("incidents:new", handleNewIncident)
    on("incidents:update", handleIncidentUpdate)
    on("incident:update", handleIncidentUpdate)

    return () => {
      off("incidents:new", handleNewIncident)
      off("incidents:update", handleIncidentUpdate)
      off("incident:update", handleIncidentUpdate)
    }
  }, [filters, on, off, subscribeToOps])

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

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case "NEW":
        return "Nuevo"
      case "ACK":
        return "Reconocido"
      case "DISPATCHED":
        return "Despachado"
      case "IN_PROGRESS":
        return "En Progreso"
      case "CLOSED":
        return "Cerrado"
      case "CANCELED":
        return "Cancelado"
      default:
        return status
    }
  }

  const getPriorityColor = (priority?: number) => {
    if (!priority) return "bg-gray-500"
    if (priority >= 3) return "bg-red-500"
    if (priority >= 2) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Lista de Incidentes
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
            <AlertTriangle className="w-5 h-5" />
            Lista de Incidentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadIncidents(filters)} variant="outline">
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
          <AlertTriangle className="w-5 h-5" />
          Lista de Incidentes
          <Badge variant="outline" className="ml-2">
            {pagination.total} total
          </Badge>
        </CardTitle>
        <Button onClick={() => loadIncidents(filters)} variant="ghost" size="sm">
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No se encontraron incidentes</p>
            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getPriorityColor(incident.priority)}`}
                        title={`Prioridad ${incident.priority || "N/A"}`}
                      />
                      <Badge variant="outline" className={getStatusColor(incident.status)}>
                        {getStatusLabel(incident.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>ID: {incident.id}</span>
                        {incident.battery && (
                          <span className="text-xs text-muted-foreground">Batería: {incident.battery}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(incident.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                          </span>
                          {incident.accuracy && <span>(±{incident.accuracy}m)</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link href={`/incidents/${incident.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalle
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/25">
                <div className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => loadIncidents({ ...filters, page: pagination.page - 1 })}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadIncidents({ ...filters, page: pagination.page + 1 })}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
