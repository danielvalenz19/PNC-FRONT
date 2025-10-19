"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Activity, Users, Shield, AlertTriangle } from "lucide-react"

interface AuditStats {
  total_actions: number
  unique_users: number
  security_events: number
  failed_logins: number
  top_actions: Array<{
    action: string
    count: number
  }>
  top_users: Array<{
    user: string
    count: number
  }>
}

interface AuditStatsProps {
  dateRange?: {
    from: string
    to: string
  }
}

export function AuditStats({ dateRange }: AuditStatsProps) {
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (dateRange?.from) params.set("from", dateRange.from)
      if (dateRange?.to) params.set("to", dateRange.to)

      const response = await apiClient.get<AuditStats>(`/ops/audit/stats?${params.toString()}`)
      setStats(response)
    } catch (err) {
      console.error("Failed to load audit stats:", err)
      setError("No se pudo cargar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const cards = [
    {
      title: "Total de Acciones",
      value: stats?.total_actions || 0,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Usuarios Activos",
      value: stats?.unique_users || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Eventos de Seguridad",
      value: stats?.security_events || 0,
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Intentos Fallidos",
      value: stats?.failed_logins || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted/50 rounded mb-2"></div>
                <div className="h-8 bg-muted/50 rounded mb-2"></div>
                <div className="h-3 bg-muted/50 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center py-6">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-2">{card.value.toLocaleString()}</p>
                  {card.title === "Intentos Fallidos" && card.value > 0 && (
                    <p className="text-xs text-red-600 mt-1">Revisar actividad sospechosa</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
