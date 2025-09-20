"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/hooks/use-socket"
import type { UnitStatus } from "@/lib/config"
import { Car, Activity, AlertTriangle, Wrench } from "lucide-react"

interface UnitStats {
  total: number
  available: number
  busy: number
  offline: number
  maintenance: number
}

interface UnitStatsProps {
  refreshTrigger: number
}

export function UnitStats({ refreshTrigger }: UnitStatsProps) {
  const [stats, setStats] = useState<UnitStats>({
    total: 0,
    available: 0,
    busy: 0,
    offline: 0,
    maintenance: 0,
  })
  const [loading, setLoading] = useState(true)
  const { on, off, subscribeToOps } = useSocket()

  const loadStats = async () => {
    try {
      setLoading(true)
      const units = await apiClient.getUnits({})

      const activeUnits = units.filter((unit: { active: boolean }) => unit.active)

      const newStats: UnitStats = {
        total: activeUnits.length,
        available: activeUnits.filter((unit: { status: UnitStatus }) => unit.status === "AVAILABLE").length,
        busy: activeUnits.filter((unit: { status: UnitStatus }) => unit.status === "BUSY").length,
        offline: activeUnits.filter((unit: { status: UnitStatus }) => unit.status === "OFFLINE").length,
        maintenance: activeUnits.filter((unit: { status: UnitStatus }) => unit.status === "MAINTENANCE").length,
      }

      setStats(newStats)
    } catch (err) {
      console.error("[v0] Failed to load unit stats:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  useEffect(() => {
    subscribeToOps()

    const handleUnitUpdate = () => {
      console.log("[v0] Unit stats update triggered")
      loadStats()
    }

    on("units:update", handleUnitUpdate)

    return () => {
      off("units:update", handleUnitUpdate)
    }
  }, [on, off, subscribeToOps])

  const cards = [
    {
      title: "Total Activas",
      value: stats.total,
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Disponibles",
      value: stats.available,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      percentage: stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0,
    },
    {
      title: "Ocupadas",
      value: stats.busy,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      percentage: stats.total > 0 ? Math.round((stats.busy / stats.total) * 100) : 0,
    },
    {
      title: "Mantenimiento",
      value: stats.maintenance,
      icon: Wrench,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      percentage: stats.total > 0 ? Math.round((stats.maintenance / stats.total) * 100) : 0,
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
                  {card.percentage !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">{card.percentage}% del total</p>
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
