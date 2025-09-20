"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { TrendingUp, User } from "lucide-react"

interface TopActivity {
  action?: string
  user?: string
  count: number
}

interface TopActivitiesProps {
  dateRange?: {
    from: string
    to: string
  }
}

export function TopActivities({ dateRange }: TopActivitiesProps) {
  const [topActions, setTopActions] = useState<TopActivity[]>([])
  const [topUsers, setTopUsers] = useState<TopActivity[]>([])
  const [loading, setLoading] = useState(true)

  const loadTopActivities = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (dateRange?.from) params.set("from", dateRange.from)
      if (dateRange?.to) params.set("to", dateRange.to)

      const response = await apiClient.get<{
        top_actions: Array<{ action: string; count: number }>
        top_users: Array<{ user: string; count: number }>
      }>(`/audit/top-activities?${params.toString()}`)

      setTopActions(response.top_actions.slice(0, 5))
      setTopUsers(response.top_users.slice(0, 5))
    } catch (err) {
      console.error("Failed to load top activities:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopActivities()
  }, [dateRange])

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted/50 rounded w-1/3"></div>
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-12 bg-muted/50 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Acciones Más Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topActions.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{getActionLabel(item.action!)}</span>
                  </div>
                  <Badge variant="outline">{item.count} veces</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Usuarios Más Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topUsers.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{item.user}</span>
                  </div>
                  <Badge variant="outline">{item.count} acciones</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
