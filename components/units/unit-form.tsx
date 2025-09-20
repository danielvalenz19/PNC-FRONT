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
import { apiClient } from "@/lib/api"
import type { UnitStatus } from "@/lib/config"
import { Car, Save, X } from "lucide-react"

interface Unit {
  id: number
  name: string
  type: string
  plate?: string
  status: UnitStatus
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
  status?: UnitStatus
}

const unitTypes = ["Patrulla", "Motocicleta", "Ambulancia", "Bomberos", "Rescate", "Comando", "Apoyo"]

const statusOptions: { value: UnitStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "BUSY", label: "Ocupada" },
  { value: "OFFLINE", label: "Fuera de línea" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
]

export function UnitForm({ unit, open, onClose, onSave }: UnitFormProps) {
  const [formData, setFormData] = useState<UnitFormData>({
    name: "",
    type: "",
    plate: "",
    active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!unit

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name,
        type: unit.type,
        plate: unit.plate || "",
        active: unit.active,
        status: unit.status,
      })
    } else {
      setFormData({
        name: "",
        type: "",
        plate: "",
        active: true,
      })
    }
    setError(null)
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

      const payload = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        plate: formData.plate.trim() || undefined,
        active: formData.active,
        ...(isEditing && formData.status && { status: formData.status }),
      }

      if (isEditing && unit) {
        await apiClient.updateUnit(unit.id, payload)
      } else {
        await apiClient.createUnit(payload)
      }

      onSave()
      onClose()
    } catch (err: any) {
      setError(err.message || "Error al guardar la unidad")
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
                {unitTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              placeholder="Ej: P-12345"
              className="bg-input/40 backdrop-blur-sm"
            />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status || ""}
                onValueChange={(value) => setFormData({ ...formData, status: value as UnitStatus })}
              >
                <SelectTrigger className="bg-input/40 backdrop-blur-sm">
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
