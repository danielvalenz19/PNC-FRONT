"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { Car, Save, X } from "lucide-react"

interface Unit {
  id: number
  name: string
  type: string
  plate?: string
  status: string
  active: boolean
  lat?: number
  lng?: number
  last_seen?: string
}

interface UnitFormProps {
  unit?: Unit | null
  open: boolean
  onClose: () => void
  onSave: () => void
}

interface UnitFormData {
  name: string
  type: string
  plate: string
  active: boolean
  // Backend tokens: available | en_route | on_site | out_of_service
  status?: string
}

// Map Spanish labels <-> API values supported by backend
const TYPE_LABEL_TO_API = {
  Patrulla: "patrol",
  Motocicleta: "moto",
  Ambulancia: "ambulance",
} as const

const TYPE_API_TO_LABEL = {
  patrol: "Patrulla",
  moto: "Motocicleta",
  ambulance: "Ambulancia",
} as const

const statusOptions: { value: string; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "en_route", label: "Ocupada" },
  { value: "on_site", label: "Ocupada (en sitio)" },
  { value: "out_of_service", label: "Fuera de línea" },
]

export function UnitForm({ unit, open, onClose, onSave }: UnitFormProps) {
  const [formData, setFormData] = useState<UnitFormData>({
    name: "",
    type: "Patrulla",
    plate: "",
    active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockIncidentId, setLockIncidentId] = useState<string | null>(null)

  const isEditing = !!unit

  useEffect(() => {
    setError(null)
    if (unit && open) {
      setFormData({
        name: unit.name ?? "",
        type:
          TYPE_API_TO_LABEL[(unit.type as keyof typeof TYPE_API_TO_LABEL) ?? "patrol"] ??
          "Patrulla",
        plate: (unit.plate ?? "").toUpperCase(),
        active: !!unit.active,
        status: unit.status,
      })
      // Fetch lock info for active assignment
      ;(async () => {
        try {
          const resp = await apiClient.get<{ incidentId: string | null }>(
            `/ops/units/${unit.id}/active-assignment`,
          )
          setLockIncidentId(resp?.incidentId ?? null)
        } catch (e) {
          setLockIncidentId(null)
        }
      })()
    } else {
      setFormData({
        name: "",
        type: "Patrulla",
        plate: "",
        active: true,
      })
      setLockIncidentId(null)
    }
  }, [unit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim() || !formData.type.trim()) {
      setError("Nombre y tipo son requeridos")
      return
    }

    try {
      setLoading(true)

      const payload: any = {
        name: formData.name.trim(),
        // Map label to API value expected by backend
        type: TYPE_LABEL_TO_API[formData.type as keyof typeof TYPE_LABEL_TO_API],
        plate: formData.plate.trim() || undefined,
        // Ensure boolean
        active: !!formData.active,
      }

      if (isEditing && formData.status) {
        // send backend-friendly token; do not include when not provided
        payload.status = formData.status
      }

      if (isEditing && unit) {
        await apiClient.patch(`/ops/units/${unit.id}`, payload)
      } else {
        await apiClient.post(`/ops/units`, payload)
      }

      onSave()
      onClose()
    } catch (err: any) {
      const msg = String(err?.message || "Error al guardar la unidad")
      // Handle 409 conflict (unit is assigned and cannot be manually freed)
      if (msg.includes("HTTP 409")) {
        toast({
          title: "No se puede cambiar el estado",
          description:
            lockIncidentId
              ? `La unidad está asignada al incidente ${lockIncidentId}. Cierra el incidente para liberarla.`
              : "La unidad está asignada; no se puede liberar manualmente.",
        })
        setLoading(false)
        return
      }
      setError(msg)
      console.error("[v0] Failed to save unit:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/25 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {isEditing ? "Editar Unidad" : "Nueva Unidad"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos de la unidad" : "Registra una nueva unidad en el sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Patrulla 001"
              className="bg-input/40 backdrop-blur-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="bg-input/40 backdrop-blur-sm">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border/25">
                <SelectItem value="Patrulla">Patrulla</SelectItem>
                <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                <SelectItem value="Ambulancia">Ambulancia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              value={formData.plate}
              onChange={(e) =>
                setFormData({ ...formData, plate: e.target.value.toUpperCase() })
              }
              placeholder="Ej: P-12345"
              className="bg-input/40 backdrop-blur-sm"
            />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status || ""}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-input/40 backdrop-blur-sm" disabled={!!lockIncidentId}>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/25">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockIncidentId && (
                <p className="text-xs mt-1">
                  Estado controlado por el incidente <b>{lockIncidentId}</b>. Se libera al cerrar el incidente.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-sm font-medium">
              Unidad activa
            </Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-1" />
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
