"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { useSocket } from "@/hooks/use-socket"
import type { IncidentStatus } from "@/lib/config"
import { AlertTriangle, Clock, MapPin, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

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

export function IncidentQueue() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { on, off, subscribeToOps } = useSocket()

  const loadIncidents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getIncidents({
        status: "NEW,ACK,DISPATCHED,IN_PROGRESS",
        limit: 10,
      })
      setIncidents(response.items)
      setError(null)
    } catch (err) {
      setError("Error al cargar incidentes")
      console.error("[v0] Failed to load incidents:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()

    subscribeToOps()

    const handleNewIncident = (data: {
      id: string
      lat: number
      lng: number
      created_at: string
      status: "NEW"
    }) => {
      console.log("[v0] New incident received:", data)
      const newIncident: Incident = {
        ...data,
        priority: 1,
      }

      setIncidents((prev) => [newIncident, ...prev.slice(0, 9)])
    }

    const handleIncidentUpdate = (data: {
      id: string
      patch: {
        status?: IncidentStatus
        location?: { lat: number; lng: number }
      }
    }) => {
      console.log("[v0] Incident update received:", data)
      setIncidents((prev) =>
        prev.map((incident) => {
          if (incident.id === data.id) {
            return {
              ...incident,
              ...(data.patch.status && { status: data.patch.status }),
              ...(data.patch.location && {
                lat: data.patch.location.lat,
                lng: data.patch.location.lng,
              }),
            }
          }
          return incident
        }),
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
  }, [on, off, subscribeToOps])

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
            Cola de Incidentes
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
            <AlertTriangle className="w-5 h-5" />
            Cola de Incidentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadIncidents} variant="outline">
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
          Cola de Incidentes
          <Badge variant="outline" className="ml-2">
            {incidents.length}
          </Badge>
        </CardTitle>
        <Button onClick={loadIncidents} variant="ghost" size="sm">
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay incidentes activos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(incident.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                      </span>
                      {incident.accuracy && <span className="text-xs">(±{incident.accuracy}m)</span>}
                    </div>
                  </div>
                </div>

                <Link href={`/incidents/${incident.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
