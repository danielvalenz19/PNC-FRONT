"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import marker2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
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

// dynamic imports para evitar SSR en Next
const MapContainer: any = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false })
const TileLayer: any = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false })
const Marker: any = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false })

// Arregla rutas de íconos por defecto de Leaflet en Next.js
const _marker2x = (marker2x as any)?.src ?? (marker2x as unknown as string)
const _marker = (markerIcon as any)?.src ?? (markerIcon as unknown as string)
const _shadow = (markerShadow as any)?.src ?? (markerShadow as unknown as string)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: _marker2x,
  iconUrl: _marker,
  shadowUrl: _shadow,
})

interface IncidentDetail {
  id: string
  status: IncidentStatus
  priority?: number
  created_at: string
  ack_at?: string | null
  closed_at?: string | null

  citizen:
    | null
    | {
        id: number
        masked?: string
        name?: string | null
        phone?: string | null
        email?: string | null
        address?: string | null
      }

  citizen_full?:
    | null
    | {
        id: number
        name: string | null
        phone: string | null
        email: string | null
        address: string | null
      }

  locations: Array<{
    lat: number
    lng: number
    accuracy?: number
    at?: string
    created_at?: string
  }>

  currentLocation?: { lat: number; lng: number; accuracy?: number; at?: string } | null

  assignments: Array<{
    id: number
    unit_id: number
    unit_name?: string
    by: string
    at: string
    cleared_at?: string | null
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

function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="h-56 rounded-xl overflow-hidden border mt-3">
      <MapContainer center={[lat, lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  )
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
    setLoading(true)
    setError(null)
    try {
      // 1) Siempre traer el detalle del incidente
  const incidentResponse = await apiClient.getIncidentDetail(incidentId)
  setIncident(incidentResponse as unknown as IncidentDetail)

      // 2) Intentar cargar unidades disponibles (sin romper el detalle si falla)
      try {
        const unitsResponse = await apiClient.getUnits({ status: "available" })
        const arr = Array.isArray(unitsResponse)
          ? unitsResponse
          : (unitsResponse as any)?.items ?? []
        setUnits(arr as Unit[])
      } catch (e) {
        console.warn("No se pudo cargar unidades, sigo con el detalle", e)
        setUnits([])
      }
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
        status?: string
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

  const currentLocation =
    incident.currentLocation ?? (incident.locations?.length ? incident.locations[incident.locations.length - 1] : null)

  // Persona a mostrar: preferir citizen_full; si no, caer a citizen (maskado)
  const person = (incident.citizen_full ?? incident.citizen ?? null) as
    | {
        id: number
        name?: string | null
        phone?: string | null
        email?: string | null
        address?: string | null
        masked?: string
      }
    | null

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
                    {Number.isFinite(Number(currentLocation.lat)) && Number.isFinite(Number(currentLocation.lng))
                      ? `${Number(currentLocation.lat).toFixed(4)}, ${Number(currentLocation.lng).toFixed(4)}`
                      : "Sin ubicación"}
                    {Number.isFinite(Number(currentLocation.accuracy)) && ` (±${Number(currentLocation.accuracy)}m)`}
                  </p>
                </div>
              </div>
            )}

            {person && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ciudadano</p>
                  <p className="text-xs text-muted-foreground">{person?.name ?? person?.masked ?? "—"}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ciudadano */}
      <Card className="glass-card mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Ciudadano
          </CardTitle>
        </CardHeader>
        <CardContent>
          {person ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Nombre</div>
                <div className="font-medium">{person?.name ?? person?.masked ?? "—"}</div>

                <div className="text-sm text-muted-foreground mt-3">Teléfono</div>
                <div className="font-medium">
                  {person?.phone ? (
                    <a href={`tel:${person.phone}`} className="hover:underline">{person.phone}</a>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="text-sm text-muted-foreground mt-3">Dirección</div>
                <div className="font-medium">{person?.address ?? "—"}</div>
              </div>

              <div>
                {currentLocation &&
                Number.isFinite(Number((currentLocation as any).lat)) &&
                Number.isFinite(Number((currentLocation as any).lng)) ? (
                  <>
                    <MiniMap lat={Number((currentLocation as any).lat)} lng={Number((currentLocation as any).lng)} />
                    <div className="text-xs text-muted-foreground mt-1">
                      {(currentLocation as any).accuracy ? `Precisión ±${(currentLocation as any).accuracy}m · ` : ""}
                      <a
                        className="hover:underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://maps.google.com/?q=${(currentLocation as any).lat},${(currentLocation as any).lng}`}
                      >
                        Abrir en Google Maps
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Sin ubicación disponible.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Incidente sin ciudadano asociado.</div>
          )}
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
            <CardTitle>Unidades asignadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incident.assignments.map((assignment) => {
                const isActive = !assignment.cleared_at
                return (
                  <div
                    key={assignment.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isActive ? "bg-blue-500/5 border-blue-500/30" : "bg-muted/20 border-border/25"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Unidad {assignment.unit_name ?? `#${assignment.unit_id}`}</p>
                        {isActive && (
                          <Badge variant="outline" className="border-blue-500/40 text-blue-700 bg-blue-500/10">
                            Activa
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Asignado por {assignment.by} • {new Date(assignment.at).toLocaleString("es-ES")}
                      </p>
                      {assignment.note && <p className="text-sm text-muted-foreground mt-1">{assignment.note}</p>}
                    </div>
                    <div>
                      <a href="/units">
                        <Button variant="ghost" size="sm">
                          Ver unidad
                        </Button>
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
