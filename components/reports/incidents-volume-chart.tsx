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

      const response = await apiClient.get<VolumeData[]>(`/reports/incidents-volume?${params.toString()}`)
      setData(response)
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgba(255,255,255,0.7)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
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
                  value,
                  name === "incidents_count" ? "Incidentes Totales" : "Incidentes Resueltos",
                ]}
              />
              <Bar dataKey="incidents_count" fill="#3b82f6" name="Incidentes Totales" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved_count" fill="#10b981" name="Incidentes Resueltos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
