"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp } from "lucide-react"

interface ResponseTimeData {
  date: string
  ttr_avg: number
  tta_avg: number
  incidents_count: number
}

interface ResponseTimeChartProps {
  dateRange: {
    from: string
    to: string
  }
}

export function ResponseTimeChart({ dateRange }: ResponseTimeChartProps) {
  const [data, setData] = useState<ResponseTimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadChartData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("from", dateRange.from)
      params.set("to", dateRange.to)
      params.set("group_by", "day")

  const response = await apiClient.get<ResponseTimeData[]>(`/ops/reports/response-times?${params.toString()}`)
      setData(response)
    } catch (err) {
      setError("Error al cargar datos del gráfico")
      console.error("Failed to load chart data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChartData()
  }, [dateRange])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tendencia de Tiempos de Respuesta
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
            <TrendingUp className="w-5 h-5" />
            Tendencia de Tiempos de Respuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
          <TrendingUp className="w-5 h-5" />
          Tendencia de Tiempos de Respuesta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgba(255,255,255,0.7)" fontSize={12} />
              <YAxis tickFormatter={formatTime} stroke="rgba(255,255,255,0.7)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                labelFormatter={(label) => `Fecha: ${formatDate(label)}`}
                formatter={(value: number, name: string) => [
                  formatTime(value),
                  name === "ttr_avg" ? "Tiempo de Respuesta" : "Tiempo de Llegada",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ttr_avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                name="Tiempo de Respuesta"
              />
              <Line
                type="monotone"
                dataKey="tta_avg"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                name="Tiempo de Llegada"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
