"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { BarChart3 } from "lucide-react"
import type { IncidentStatus } from "@/lib/config"

interface StatusData {
  status: IncidentStatus
  count: number
  percentage: number
}

interface IncidentsByStatusChartProps {
  dateRange: {
    from: string
    to: string
  }
}

const STATUS_COLORS = {
  NEW: "#ef4444",
  ACK: "#f59e0b",
  DISPATCHED: "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  CLOSED: "#10b981",
  CANCELED: "#6b7280",
}

const STATUS_LABELS = {
  NEW: "Nuevo",
  ACK: "Reconocido",
  DISPATCHED: "Despachado",
  IN_PROGRESS: "En Progreso",
  CLOSED: "Cerrado",
  CANCELED: "Cancelado",
}

export function IncidentsByStatusChart({ dateRange }: IncidentsByStatusChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatusData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("from", dateRange.from)
      params.set("to", dateRange.to)

      const response = await apiClient.get<any>(`/ops/reports/incidents-by-status?${params.toString()}`)
      // Normalize payload to array and compute percentage client-side
      const raw: any[] = Array.isArray(response)
        ? response
        : (response?.items || response?.data || [])
      const total = raw.reduce((sum, r) => sum + Number(r?.count ?? 0), 0)
      const normalized = raw.map((r) => {
        const count = Number(r?.count ?? 0)
        const pct = total > 0 ? (count / total) * 100 : 0
        return {
          ...r,
          // Normalize status to uppercase to match labels/colors map
          status: String(r?.status ?? "").toUpperCase(),
          count,
          percentage: Number.isFinite(Number(r?.percentage)) ? Number(r.percentage) : pct,
        }
      })
      setData(normalized as any[])
    } catch (err) {
      setError("Error al cargar datos por estado")
      console.error("Failed to load status data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatusData()
  }, [dateRange])

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0]
      const d = p?.payload || {}
      const pctFromData = Number(d?.percentage)
      const percent = Number.isFinite(pctFromData)
        ? pctFromData
        : Number(p?.percent ?? 0) * 100
      const statusKey = String(d?.status ?? "").toUpperCase() as IncidentStatus
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/25 rounded-lg p-3 shadow-lg">
          <p className="font-medium">{STATUS_LABELS[statusKey as IncidentStatus] || statusKey}</p>
          <p className="text-sm text-muted-foreground">
            {Number(d?.count ?? 0)} incidentes ({Number.isFinite(percent) ? percent.toFixed(1) : "-"}%)
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Incidentes por Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando gráfico...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Incidentes por Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{error || "No hay datos disponibles para el rango seleccionado"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Incidentes por Estado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={(info: any) => `${Number((info?.percent ?? 0) * 100).toFixed(1)}%`}
              >
                {data.map((entry, index) => {
                  const key = String(entry.status).toUpperCase() as keyof typeof STATUS_COLORS
                  const color = STATUS_COLORS[key] ?? "#9ca3af"
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend
                formatter={(value: any, entry: any) => {
                  const key = String(value).toUpperCase() as IncidentStatus
                  const label = STATUS_LABELS[key] || key
                  return (
                    <span style={{ color: entry?.color }}>
                      {label} ({entry?.payload?.count})
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
