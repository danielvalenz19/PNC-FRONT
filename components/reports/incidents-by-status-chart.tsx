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
  const [data, setData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatusData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("from", dateRange.from)
      params.set("to", dateRange.to)

      const response = await apiClient.get<StatusData[]>(`/reports/incidents-by-status?${params.toString()}`)
      setData(response)
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
      const data = payload[0].payload
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/25 rounded-lg p-3 shadow-lg">
          <p className="font-medium">{STATUS_LABELS[data.status as IncidentStatus]}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} incidentes ({data.percentage.toFixed(1)}%)
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
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {STATUS_LABELS[value as IncidentStatus]} ({entry.payload?.count})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
