"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface SystemSettings {
  maxResponseTime: number
  autoAssignUnits: boolean
  notificationSound: boolean
  mapRefreshInterval: number
  defaultPriority: string
  emergencyContacts: string
  systemMaintenance: boolean
}

export function SystemSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    maxResponseTime: 300,
    autoAssignUnits: true,
    notificationSound: true,
    mapRefreshInterval: 30,
    defaultPriority: "medium",
    emergencyContacts: "",
    systemMaintenance: false,
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await apiClient.put("/settings/system", settings)
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
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
          <CardTitle>Configuración del Sistema</CardTitle>
          <CardDescription>Ajusta los parámetros generales del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxResponseTime">Tiempo máximo de respuesta (segundos)</Label>
              <Input
                id="maxResponseTime"
                type="number"
                value={settings.maxResponseTime}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    maxResponseTime: Number.parseInt(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapRefreshInterval">Intervalo de actualización del mapa (segundos)</Label>
              <Input
                id="mapRefreshInterval"
                type="number"
                value={settings.mapRefreshInterval}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    mapRefreshInterval: Number.parseInt(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultPriority">Prioridad por defecto</Label>
              <Select
                value={settings.defaultPriority}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultPriority: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoAssign">Asignación automática de unidades</Label>
                <Switch
                  id="autoAssign"
                  checked={settings.autoAssignUnits}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoAssignUnits: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Sonidos de notificación</Label>
                <Switch
                  id="notifications"
                  checked={settings.notificationSound}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notificationSound: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance">Modo mantenimiento</Label>
                <Switch
                  id="maintenance"
                  checked={settings.systemMaintenance}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      systemMaintenance: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContacts">Contactos de emergencia</Label>
            <Textarea
              id="emergencyContacts"
              placeholder="Lista de contactos de emergencia..."
              value={settings.emergencyContacts}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  emergencyContacts: e.target.value,
                }))
              }
              rows={4}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
