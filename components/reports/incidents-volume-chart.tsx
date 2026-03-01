"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity } from "lucide-react"

interface VolumeData {
  date: string
  incidents_count: number
  resolved_count: number
  avg_resolution_time: number
}

interface IncidentsVolumeChartProps {
  dateRange: {
    from: string
    to: string
  }
}

export function IncidentsVolumeChart({ dateRange }: IncidentsVolumeChartProps) {
  const [data, setData] = useState<VolumeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVolumeData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("from", dateRange.from)
      params.set("to", dateRange.to)
      params.set("group_by", "day")

      const response = await apiClient.get<any>(`/ops/reports/incidents-volume?${params.toString()}`)

      // Normaliza nombres y tipos para el BarChart
      const mapped: VolumeData[] = (response ?? []).map((r: any) => ({
        date: String(r.date ?? r.bucket ?? ""),
        incidents_count: Number(r.incidents_count ?? r.created ?? 0),
        resolved_count: Number(r.resolved_count ?? r.closed ?? 0),
        avg_resolution_time: Number(r.avg_resolution_time ?? r.avg_res_sec ?? 0),
      }))

      setData(mapped)
    } catch (err) {
      setError("Error al cargar datos de volumen")
      console.error("Failed to load volume data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVolumeData()
  }, [dateRange])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })
  }

  const cssColor = (name: string, fallback: string) => {
    if (typeof window === "undefined") return fallback
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    if (!raw) return fallback
    if (/^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/.test(raw)) return `hsl(${raw})`
    return raw
  }

  const gridColor = cssColor("--border", "rgba(148, 163, 184, 0.35)")
  const axisColor = cssColor("--muted-foreground", "#64748b")
  const tooltipBg = cssColor("--popover", "#ffffff")
  const tooltipBorder = cssColor("--border", "#e5e7eb")
  const tooltipText = cssColor("--popover-foreground", "#111827")
  const incidentsColor = cssColor("--chart-1", "#3b82f6")
  const resolvedColor = cssColor("--chart-2", "#10b981")

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Volumen de Incidentes
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
            <Activity className="w-5 h-5" />
            Volumen de Incidentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
          <Activity className="w-5 h-5" />
          Volumen de Incidentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 12 }}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "8px",
                  color: tooltipText,
                }}
                labelFormatter={(label) => `Fecha: ${formatDate(label)}`}
                formatter={(value: number, name: string) => [
                  value,
                  name === "incidents_count" ? "Incidentes Totales" : "Incidentes Resueltos",
                ]}
              />
              <Bar dataKey="incidents_count" fill={incidentsColor} name="Incidentes Totales" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved_count" fill={resolvedColor} name="Incidentes Resueltos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
