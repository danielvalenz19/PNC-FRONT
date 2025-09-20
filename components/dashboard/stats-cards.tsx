"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { AlertTriangle, Car, Clock, CheckCircle } from "lucide-react"

interface DashboardStats {
  activeIncidents: number
  newIncidents: number
  availableUnits: number
  totalUnits: number
  avgResponseTime: number
  slaCompliance: number
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    try {
      setLoading(true)

      // Load incidents stats
      const incidentsResponse = await apiClient.getIncidents({
        // Opción A: no enviar `status`, el backend listará por defecto
      })
      const activeIncidents = incidentsResponse.items.length
      const newIncidents = incidentsResponse.items.filter((i: any) => i.status === "NEW").length

      // Load units stats
  const unitsResponse = await apiClient.getUnits()
  const totalUnits = unitsResponse.length
  // Backend uses lowercase statuses: available, en_route, on_site, out_of_service
  const availableUnits = unitsResponse.filter((u: any) => u.status === "available").length
  const busyUnits = unitsResponse.filter((u: any) => ["en_route", "on_site"].includes(u.status)).length
  const maintenanceUnits = unitsResponse.filter((u: any) => u.status === "out_of_service").length

      // Load KPIs for response time and SLA
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      try {
        const kpisResponse: any = await apiClient.getKPIs(lastWeek.toISOString(), today.toISOString())

        setStats({
          activeIncidents,
          newIncidents,
          availableUnits,
          totalUnits,
          avgResponseTime: kpisResponse.ttr?.p50 || 0,
          slaCompliance: kpisResponse.sla_pct || 0,
        })
      } catch (kpiError) {
        // Fallback if KPIs endpoint fails
        setStats({
          activeIncidents,
          newIncidents,
          availableUnits,
          totalUnits,
          avgResponseTime: 0,
          slaCompliance: 0,
        })
      }
    } catch (err) {
      console.error("[v0] Failed to load dashboard stats:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const cards = [
    {
      title: "Incidentes Activos",
      value: stats?.activeIncidents || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      change: stats?.newIncidents ? `+${stats.newIncidents} nuevos` : undefined,
      changeColor: "text-red-600",
    },
    {
      title: "Unidades Disponibles",
      value: `${stats?.availableUnits || 0}/${stats?.totalUnits || 0}`,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
          change: stats ? `${Math.round((stats.availableUnits / stats.totalUnits) * 100)}% disponible` : undefined,
      changeColor: "text-green-600",
    },
    {
      title: "Tiempo de Respuesta",
      value: stats ? formatTime(stats.avgResponseTime) : "--",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      change: "Promedio 7 días",
      changeColor: "text-muted-foreground",
    },
    {
      title: "Cumplimiento SLA",
      value: stats ? `${Math.round(stats.slaCompliance)}%` : "--",
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      change: stats && stats.slaCompliance >= 90 ? "Objetivo cumplido" : "Por debajo del objetivo",
      changeColor: stats && stats.slaCompliance >= 90 ? "text-green-600" : "text-red-600",
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
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                  {card.change && <p className={`text-xs mt-1 ${card.changeColor}`}>{card.change}</p>}
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
