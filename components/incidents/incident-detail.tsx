"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/hooks/use-socket"
import type { IncidentStatus } from "@/lib/config"
import {
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Car,
  MessageSquare,
  CheckCircle,
  Send,
  AlertCircle,
  Activity,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface IncidentDetail {
  id: string
  citizen: { masked: string } | null
  status: IncidentStatus
  locations: Array<{
    at: string
    lat: number
    lng: number
    accuracy?: number
  }>
  assignments: Array<{
    id: number
    unit_id: number
    by: string
    at: string
    note?: string
  }>
  events: Array<{
    id: number
    type: string
    at: string
    by?: string
    notes?: string
  }>
  started_at: string
  ended_at?: string | null
}

interface Unit {
  id: number
  name: string
  status: string
  type: string
}

interface IncidentDetailProps {
  incidentId: string
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const [incident, setIncident] = useState<IncidentDetail | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { on, off, subscribeToIncident } = useSocket()

  // Action dialogs state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)

  // Form state
  const [selectedUnit, setSelectedUnit] = useState<string>("")
  const [assignNote, setAssignNote] = useState("")
  const [newStatus, setNewStatus] = useState<IncidentStatus | "">("")
  const [statusReason, setStatusReason] = useState("")
  const [noteText, setNoteText] = useState("")

  const loadIncidentDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const [incidentResponse, unitsResponse] = await Promise.all([
        apiClient.getIncidentDetail(incidentId),
        apiClient.getUnits({ status: "AVAILABLE,BUSY" }),
      ])

      setIncident(incidentResponse)
      setUnits(unitsResponse.filter((unit: Unit) => unit.status === "AVAILABLE"))
    } catch (err) {
      setError("Error al cargar el detalle del incidente")
      console.error("[v0] Failed to load incident detail:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidentDetail()
    subscribeToIncident(incidentId)

    const handleIncidentUpdate = (data: {
      id: string
      patch: {
        status?: IncidentStatus
        location?: { lat: number; lng: number }
        assignment?: any
        event?: any
      }
    }) => {
      if (data.id === incidentId) {
        console.log("[v0] Incident detail update received:", data)
        loadIncidentDetail() // Reload full detail on any update
      }
    }

    on("incidents:update", handleIncidentUpdate)
    on("incident:update", handleIncidentUpdate)

    return () => {
      off("incidents:update", handleIncidentUpdate)
      off("incident:update", handleIncidentUpdate)
    }
  }, [incidentId, on, off, subscribeToIncident])

  const handleAck = async () => {
    try {
      setActionLoading("ack")
      await apiClient.ackIncident(incidentId)
      await loadIncidentDetail()
    } catch (err) {
      console.error("[v0] Failed to acknowledge incident:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssign = async () => {
    if (!selectedUnit) return

    try {
      setActionLoading("assign")
      await apiClient.assignIncident(incidentId, selectedUnit, assignNote || undefined)

      setAssignDialogOpen(false)
      setSelectedUnit("")
      setAssignNote("")
      await loadIncidentDetail()
    } catch (err) {
      console.error("[v0] Failed to assign incident:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async () => {
    if (!newStatus) return

    try {
      setActionLoading("status")
      await apiClient.updateIncidentStatus(incidentId, newStatus, statusReason || undefined)

      setStatusDialogOpen(false)
      setNewStatus("")
      setStatusReason("")
      await loadIncidentDetail()
    } catch (err) {
      console.error("[v0] Failed to change status:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return

    try {
      setActionLoading("note")
      await apiClient.addIncidentNote(incidentId, noteText)

      setNoteDialogOpen(false)
      setNoteText("")
      await loadIncidentDetail()
    } catch (err) {
      console.error("[v0] Failed to add note:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case "NEW":
        return "bg-red-500/20 text-red-700 border-red-500/30"
      case "ACK":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
      case "DISPATCHED":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30"
      case "IN_PROGRESS":
        return "bg-purple-500/20 text-purple-700 border-purple-500/30"
      case "CLOSED":
        return "bg-green-500/20 text-green-700 border-green-500/30"
      case "CANCELED":
        return "bg-gray-500/20 text-gray-700 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30"
    }
  }

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case "NEW":
        return "Nuevo"
      case "ACK":
        return "Reconocido"
      case "DISPATCHED":
        return "Despachado"
      case "IN_PROGRESS":
        return "En Progreso"
      case "CLOSED":
        return "Cerrado"
      case "CANCELED":
        return "Cancelado"
      default:
        return status
    }
  }

  const canAck = incident?.status === "NEW"
  const canAssign = incident?.status === "ACK"
  const canChangeStatus = incident && !["CLOSED", "CANCELED"].includes(incident.status)

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted/50 rounded w-1/3"></div>
                <div className="h-4 bg-muted/50 rounded w-2/3"></div>
                <div className="h-20 bg-muted/50 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !incident) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error || "Incidente no encontrado"}</p>
            <Button onClick={loadIncidentDetail} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentLocation = incident.locations[incident.locations.length - 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Incidente {incident.id}
              </CardTitle>
              <Badge variant="outline" className={getStatusColor(incident.status)}>
                {getStatusLabel(incident.status)}
              </Badge>
            </div>
            <div className="flex gap-2">
              {canAck && (
                <Button
                  onClick={handleAck}
                  disabled={actionLoading === "ack"}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {actionLoading === "ack" ? "Procesando..." : "Reconocer"}
                </Button>
              )}

              {canAssign && (
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Car className="w-4 h-4 mr-1" />
                      Asignar Unidad
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-border/25">
                    <DialogHeader>
                      <DialogTitle>Asignar Unidad</DialogTitle>
                      <DialogDescription>Selecciona una unidad disponible para este incidente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Unidad</Label>
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.name} ({unit.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nota (opcional)</Label>
                        <Textarea
                          value={assignNote}
                          onChange={(e) => setAssignNote(e.target.value)}
                          placeholder="Instrucciones adicionales..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAssign} disabled={!selectedUnit || actionLoading === "assign"}>
                        {actionLoading === "assign" ? "Asignando..." : "Asignar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canChangeStatus && (
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Activity className="w-4 h-4 mr-1" />
                      Cambiar Estado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-border/25">
                    <DialogHeader>
                      <DialogTitle>Cambiar Estado</DialogTitle>
                      <DialogDescription>Actualiza el estado del incidente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nuevo Estado</Label>
                        <Select value={newStatus} onValueChange={(value) => setNewStatus(value as IncidentStatus)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DISPATCHED">Despachado</SelectItem>
                            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                            <SelectItem value="CLOSED">Cerrado</SelectItem>
                            <SelectItem value="CANCELED">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Razón (opcional)</Label>
                        <Textarea
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="Motivo del cambio de estado..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleStatusChange} disabled={!newStatus || actionLoading === "status"}>
                        {actionLoading === "status" ? "Actualizando..." : "Actualizar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Agregar Nota
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-border/25">
                  <DialogHeader>
                    <DialogTitle>Agregar Nota</DialogTitle>
                    <DialogDescription>Añade una nota al incidente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nota</Label>
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Escribe tu nota aquí..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddNote} disabled={!noteText.trim() || actionLoading === "note"}>
                      <Send className="w-4 h-4 mr-1" />
                      {actionLoading === "note" ? "Guardando..." : "Guardar Nota"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Iniciado</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(incident.started_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            {currentLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ubicación Actual</p>
                  <p className="text-xs text-muted-foreground">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    {currentLocation.accuracy && ` (±${currentLocation.accuracy}m)`}
                  </p>
                </div>
              </div>
            )}

            {incident.citizen && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ciudadano</p>
                  <p className="text-xs text-muted-foreground">{incident.citizen.masked}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Timeline de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incident.events.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  {index < incident.events.length - 1 && <div className="w-px h-8 bg-border mt-2"></div>}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{event.type}</span>
                    {event.by && <span className="text-xs text-muted-foreground">por {event.by}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{new Date(event.at).toLocaleString("es-ES")}</p>
                  {event.notes && <p className="text-sm text-muted-foreground">{event.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignments */}
      {incident.assignments.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Asignaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incident.assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <p className="font-medium">Unidad {assignment.unit_id}</p>
                    <p className="text-sm text-muted-foreground">
                      Asignado por {assignment.by} • {new Date(assignment.at).toLocaleString("es-ES")}
                    </p>
                    {assignment.note && <p className="text-sm text-muted-foreground mt-1">{assignment.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
