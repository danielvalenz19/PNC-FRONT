"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { Clock, Target, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface KPIData {
  ttr: {
    p50: number
    p90: number
    p95: number
  }
  tta: {
    p50: number
    p90: number
    p95: number
  }
  sla_pct: number
  cancellations_pct: number
}

interface KPICardsProps {
  dateRange: {
    from: string
    to: string
  }
}

export function KPICards({ dateRange }: KPICardsProps) {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadKPIs = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("from", dateRange.from)
      params.set("to", dateRange.to)

  const response = await apiClient.get<KPIData>(`/ops/reports/kpis?${params.toString()}`)
      setKpis(response)
    } catch (err) {
      setError("Error al cargar KPIs")
      console.error("Failed to load KPIs:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKPIs()
  }, [dateRange])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const getSLAStatus = (percentage: number) => {
    if (percentage >= 95) return { color: "text-green-600", bg: "bg-green-500/10", status: "Excelente" }
    if (percentage >= 90) return { color: "text-blue-600", bg: "bg-blue-500/10", status: "Bueno" }
    if (percentage >= 80) return { color: "text-yellow-600", bg: "bg-yellow-500/10", status: "Regular" }
    return { color: "text-red-600", bg: "bg-red-500/10", status: "Crítico" }
  }

  const getCancellationStatus = (percentage: number) => {
    if (percentage <= 5) return { color: "text-green-600", bg: "bg-green-500/10", status: "Excelente" }
    if (percentage <= 10) return { color: "text-yellow-600", bg: "bg-yellow-500/10", status: "Aceptable" }
    return { color: "text-red-600", bg: "bg-red-500/10", status: "Alto" }
  }

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

  if (error || !kpis) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error || "No se pudieron cargar los KPIs"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const slaStatus = getSLAStatus(kpis.sla_pct)
  const cancellationStatus = getCancellationStatus(kpis.cancellations_pct)

  const cards = [
    {
      title: "Tiempo de Respuesta",
      subtitle: "TTR (Time to Response)",
      value: formatTime(kpis.ttr.p50),
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      details: [
        { label: "P50", value: formatTime(kpis.ttr.p50) },
        { label: "P90", value: formatTime(kpis.ttr.p90) },
        { label: "P95", value: formatTime(kpis.ttr.p95) },
      ],
    },
    {
      title: "Tiempo de Llegada",
      subtitle: "TTA (Time to Arrival)",
      value: formatTime(kpis.tta.p50),
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      details: [
        { label: "P50", value: formatTime(kpis.tta.p50) },
        { label: "P90", value: formatTime(kpis.tta.p90) },
        { label: "P95", value: formatTime(kpis.tta.p95) },
      ],
    },
    {
      title: "Cumplimiento SLA",
      subtitle: "Service Level Agreement",
      value: `${Math.round(kpis.sla_pct)}%`,
      icon: CheckCircle,
      color: slaStatus.color,
      bgColor: slaStatus.bg,
      badge: slaStatus.status,
      badgeColor: slaStatus.color,
    },
    {
      title: "Tasa de Cancelación",
      subtitle: "Incidentes cancelados",
      value: `${Math.round(kpis.cancellations_pct)}%`,
      icon: XCircle,
      color: cancellationStatus.color,
      bgColor: cancellationStatus.bg,
      badge: cancellationStatus.status,
      badgeColor: cancellationStatus.color,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-2xl font-bold">{card.value}</p>
                {card.badge && (
                  <Badge variant="outline" className={`text-xs ${card.badgeColor} border-current`}>
                    {card.badge}
                  </Badge>
                )}
              </div>
              {card.details && (
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  {card.details.map((detail, i) => (
                    <div key={i} className="text-center">
                      <p className="font-medium">{detail.label}</p>
                      <p>{detail.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
