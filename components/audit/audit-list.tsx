"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import type { AuditFilters } from "./audit-filters"
import { FileText, Clock, User, Activity, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface AuditEntry {
  id: number
  who: string
  action: string
  entity: string
  entity_id: string | number
  at: string
  ip?: string
}

interface AuditListResponse {
  items: AuditEntry[]
  page: number
  total: number
}

interface AuditListProps {
  filters: AuditFilters
}

export function AuditList({ filters }: AuditListProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  const loadAuditEntries = async (currentFilters: AuditFilters) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (currentFilters.actor) params.set("actor", currentFilters.actor)
      if (currentFilters.action) params.set("action", currentFilters.action)
      if (currentFilters.from) params.set("from", currentFilters.from)
      if (currentFilters.to) params.set("to", currentFilters.to)
      params.set("page", (currentFilters.page || 1).toString())
      params.set("limit", (currentFilters.limit || 20).toString())

  const response = await apiClient.get<AuditListResponse>(`/ops/audit?${params.toString()}`)

      setEntries(response.items)
      setPagination({
        page: response.page,
        total: response.total,
        totalPages: Math.ceil(response.total / (currentFilters.limit || 20)),
      })
    } catch (err) {
      setError("Error al cargar registros de auditoría")
      console.error("Failed to load audit entries:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditEntries(filters)
  }, [filters])

  const getActionColor = (action: string) => {
    if (action.includes("login")) return "bg-green-500/20 text-green-700 border-green-500/30"
    if (action.includes("logout")) return "bg-gray-500/20 text-gray-700 border-gray-500/30"
    if (action.includes("create")) return "bg-blue-500/20 text-blue-700 border-blue-500/30"
    if (action.includes("update")) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
    if (action.includes("delete")) return "bg-red-500/20 text-red-700 border-red-500/30"
    return "bg-purple-500/20 text-purple-700 border-purple-500/30"
  }

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, string> = {
      login: "Inicio de sesión",
      logout: "Cierre de sesión",
      incident_create: "Crear incidente",
      incident_ack: "Reconocer incidente",
      incident_assign: "Asignar incidente",
      incident_status_change: "Cambiar estado",
      incident_note_add: "Agregar nota",
      unit_create: "Crear unidad",
      unit_update: "Actualizar unidad",
      unit_delete: "Eliminar unidad",
      settings_update: "Actualizar configuración",
      simulation_create: "Crear simulación",
      simulation_update: "Actualizar simulación",
    }
    return actionLabels[action] || action
  }

  const getEntityLink = (entity: string, entityId: string | number) => {
    switch (entity) {
      case "incident":
        return `/incidents/${entityId}`
      case "unit":
        return `/units`
      case "settings":
        return `/settings`
      case "simulation":
        return `/simulations`
      default:
        return null
    }
  }

  const getEntityLabel = (entity: string) => {
    const entityLabels: Record<string, string> = {
      incident: "Incidente",
      unit: "Unidad",
      settings: "Configuración",
      simulation: "Simulación",
      user: "Usuario",
    }
    return entityLabels[entity] || entity
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Registro de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted/50 rounded-lg"></div>
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
            <FileText className="w-5 h-5" />
            Registro de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => loadAuditEntries(filters)} variant="outline">
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
          <FileText className="w-5 h-5" />
          Registro de Auditoría
          <Badge variant="outline" className="ml-2">
            {pagination.total} registros
          </Badge>
        </CardTitle>
        <Button onClick={() => loadAuditEntries(filters)} variant="ghost" size="sm">
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No se encontraron registros</p>
            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {entries.map((entry) => {
                const entityLink = getEntityLink(entry.entity, entry.entity_id)
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getActionColor(entry.action)}>
                          {getActionLabel(entry.action)}
                        </Badge>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="w-3 h-3" />
                          <span>{entry.who}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {getEntityLabel(entry.entity)} {entry.entity_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDistanceToNow(new Date(entry.at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                          {entry.ip && (
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              <span>IP: {entry.ip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {entityLink && (
                      <Link href={entityLink}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })}
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
                    onClick={() => loadAuditEntries({ ...filters, page: pagination.page - 1 })}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadAuditEntries({ ...filters, page: pagination.page + 1 })}
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
