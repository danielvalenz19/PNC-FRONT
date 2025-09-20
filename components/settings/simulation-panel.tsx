"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Play, Square, RotateCcw } from "lucide-react"

interface SimulationConfig {
  type: string
  duration: number
  incidentCount: number
  area: string
  description: string
}

export function SimulationPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [config, setConfig] = useState<SimulationConfig>({
    type: "emergency",
    duration: 60,
    incidentCount: 5,
    area: "downtown",
    description: "",
  })

  const handleStartSimulation = async () => {
    setLoading(true)
    try {
      await apiClient.post("/simulations/start", config)
      setIsRunning(true)
      toast({
        title: "Simulación iniciada",
        description: "La simulación se está ejecutando",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la simulación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStopSimulation = async () => {
    setLoading(true)
    try {
      await apiClient.post("/simulations/stop")
      setIsRunning(false)
      toast({
        title: "Simulación detenida",
        description: "La simulación se ha detenido correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo detener la simulación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetSimulation = async () => {
    setLoading(true)
    try {
      await apiClient.post("/simulations/reset")
      setIsRunning(false)
      toast({
        title: "Simulación reiniciada",
        description: "El sistema ha sido reiniciado",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reiniciar la simulación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Panel de Simulaciones</CardTitle>
              <CardDescription>Ejecuta simulaciones para entrenar al personal</CardDescription>
            </div>
            <Badge variant={isRunning ? "default" : "secondary"}>{isRunning ? "En ejecución" : "Detenida"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="simType">Tipo de simulación</Label>
              <Select
                value={config.type}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">Emergencia</SelectItem>
                  <SelectItem value="disaster">Desastre natural</SelectItem>
                  <SelectItem value="security">Seguridad</SelectItem>
                  <SelectItem value="medical">Médica</SelectItem>
                  <SelectItem value="fire">Incendio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={config.duration}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    duration: Number.parseInt(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentCount">Número de incidentes</Label>
              <Input
                id="incidentCount"
                type="number"
                value={config.incidentCount}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    incidentCount: Number.parseInt(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área de simulación</Label>
              <Select
                value={config.area}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    area: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downtown">Centro</SelectItem>
                  <SelectItem value="residential">Residencial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="commercial">Comercial</SelectItem>
                  <SelectItem value="full-city">Ciudad completa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción del escenario</Label>
            <Textarea
              id="description"
              placeholder="Describe el escenario de la simulación..."
              value={config.description}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            {!isRunning ? (
              <Button onClick={handleStartSimulation} disabled={loading} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                {loading ? "Iniciando..." : "Iniciar Simulación"}
              </Button>
            ) : (
              <Button onClick={handleStopSimulation} disabled={loading} variant="destructive" className="flex-1">
                <Square className="w-4 h-4 mr-2" />
                {loading ? "Deteniendo..." : "Detener Simulación"}
              </Button>
            )}

            <Button onClick={handleResetSimulation} disabled={loading} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
