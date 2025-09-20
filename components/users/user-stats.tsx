"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/hooks/use-socket"
import { Users, UserCheck, UserX, Headphones } from "lucide-react"

interface UserStats {
  total: number
  active: number
  inactive: number
  admins: number
  operators: number
  supervisors: number
  units: number
}

interface UserStatsProps {
  refreshTrigger: number
}

export function UserStats({ refreshTrigger }: UserStatsProps) {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    operators: 0,
    supervisors: 0,
    units: 0,
  })
  const [loading, setLoading] = useState(true)
  const { on, off, subscribeToOps } = useSocket()

  const loadStats = async () => {
    try {
      setLoading(true)
      const users = await apiClient.getUsers({})

      // Backend returns { meta, data }
      let data: any[] = []
      let meta: any = { total: 0 }

      if (Array.isArray(users)) {
        data = users
        meta = { total: users.length }
      } else {
        const resp: any = users
        data = resp?.data ?? resp?.items ?? []
        meta = resp?.meta ?? { total: data.length }
      }

      const newStats: UserStats = {
        total: meta.total || data.length,
        active: data.filter((user: { status: string }) => user.status === "active").length,
        inactive: data.filter((user: { status: string }) => user.status === "inactive").length,
        admins: data.filter((user: { role: string }) => user.role === "admin").length,
        operators: data.filter((user: { role: string }) => user.role === "operator").length,
        supervisors: data.filter((user: { role: string }) => user.role === "supervisor").length,
        units: data.filter((user: { role: string }) => user.role === "unit").length,
      }

      setStats(newStats)
    } catch (err) {
      console.error("[v0] Failed to load user stats:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  useEffect(() => {
    subscribeToOps()

    const handleUserUpdate = () => {
      console.log("[v0] User stats update triggered")
      loadStats()
    }

  on("users:update" as any, handleUserUpdate)

    return () => {
      off("users:update" as any, handleUserUpdate)
    }
  }, [on, off, subscribeToOps])

  const cards = [
    {
      title: "Total Personal",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Personal Activo",
      value: stats.active,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      percentage: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0,
    },
    {
      title: "Operadores",
      value: stats.operators,
      icon: Headphones,
      color: "text-carolina-blue",
      bgColor: "bg-carolina-blue/10",
      percentage: stats.total > 0 ? Math.round((stats.operators / stats.total) * 100) : 0,
    },
    {
      title: "Personal Inactivo",
      value: stats.inactive,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      percentage: stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0,
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
