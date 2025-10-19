"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Users, Save, X } from "lucide-react"

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "operator" | "supervisor" | "unit"
  status: "active" | "inactive"
  created_at: string
  last_login?: string
  phone?: string
}

interface UserFormProps {
  user?: User | null
  open: boolean
  onClose: () => void
  onSave: () => void
}

interface UserFormData {
  name: string
  email: string
  role: "admin" | "operator" | "supervisor" | "unit" | ""
  phone: string
}

const roleOptions: { value: "admin" | "operator" | "supervisor" | "unit"; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operador" },
  { value: "unit", label: "Unidad" },
]

export function UserForm({ user, open, onClose, onSave }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    role: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const isEditing = !!user

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "",
        phone: "",
      })
    }
    setError(null)
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      setError("Nombre, email y rol son requeridos")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Por favor ingresa un email válido")
      return
    }

    try {
      setLoading(true)

      const payload = {
        email: formData.email.trim(),
        full_name: formData.name.trim(),
        role: formData.role,
        ...(formData.phone.trim() && { phone: formData.phone.trim() }),
      }

      if (isEditing && user) {
        await apiClient.updateUser(user.id, {
          email: payload.email,
          full_name: payload.full_name,
          role: payload.role,
          phone: formData.phone?.trim() ? formData.phone.trim() : null,
        })

        toast({
          title: "Usuario actualizado",
          description: `Usuario ${formData.name} actualizado exitosamente`,
        })
      } else {
        const response = await apiClient.createUser(payload)

        toast({
          title: "Usuario creado",
          description: `Usuario ${formData.name} creado exitosamente`,
        })

        if (response && typeof response === "object" && "id" in response) {
          console.log("[v0] New user created with ID:", (response as any).id)
        }
      }

      onSave()
      onClose()
    } catch (err: any) {
      let errorMessage = "Error al guardar el usuario"

      if (err.message) {
        if (err.message.includes("409")) {
          errorMessage = "Ya existe un usuario con este email"
        } else if (err.message.includes("403")) {
          errorMessage = "No tienes permisos para realizar esta acción"
        } else if (err.message.includes("401")) {
          errorMessage = "Tu sesión ha expirado, por favor inicia sesión nuevamente"
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
      console.error("[v0] Failed to save user:", err)
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
            <Users className="w-5 h-5" />
            {isEditing ? "Editar Usuario" : "Crear Personal"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del usuario" : "Registra un nuevo miembro del personal"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ej: jperez@pnc.gob.sv"
              className="bg-input/40 backdrop-blur-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Juan Pérez"
              className="bg-input/40 backdrop-blur-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as any })}>
              <SelectTrigger className="bg-input/40 backdrop-blur-sm">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border/25">
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej: +503 1234-5678"
              className="bg-input/40 backdrop-blur-sm"
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
