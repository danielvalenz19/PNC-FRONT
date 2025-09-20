"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { useSocket } from "@/hooks/use-socket"
import type { IncidentStatus } from "@/lib/config"
import { LucideMap, Layers } from "lucide-react"
import dynamic from "next/dynamic"
import L from "leaflet"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

interface MapIncident {
  id: string
  lat: number
  lng: number
  status: IncidentStatus
  created_at: string
  priority?: number
}

interface Unit {
  id: number
  name: string
  lat?: number
  lng?: number
  status: string
  last_seen?: string
}

export function IncidentMap() {
  const [incidents, setIncidents] = useState<MapIncident[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showUnits, setShowUnits] = useState(true)
  const mapRef = useRef<any>(null)
  const { on, off, subscribeToOps } = useSocket()

  // San Salvador coordinates as default center
  const defaultCenter: [number, number] = [13.6929, -89.2182]

  const loadMapData = async () => {
    try {
      setLoading(true)

      // Load active incidents
      const incidentsResponse = await apiClient.getIncidents({
        status: "NEW,ACK,DISPATCHED,IN_PROGRESS",
        limit: 100,
      })
      setIncidents(incidentsResponse.items)

      // Load units with location
      const unitsResponse = await apiClient.getUnits({
        status: "AVAILABLE,BUSY",
      })
      setUnits(unitsResponse.filter((unit: Unit) => unit.lat && unit.lng))
    } catch (err) {
      console.error("[v0] Failed to load map data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMapData()
    subscribeToOps()

    const handleNewIncident = (data: {
      id: string
      lat: number
      lng: number
      created_at: string
      status: "NEW"
    }) => {
      console.log("[v0] New incident on map:", data)
      const newIncident: MapIncident = {
        ...data,
        priority: 1,
      }

      setIncidents((prev) => [...prev, newIncident])
    }

    const handleIncidentUpdate = (data: {
      id: string
      patch: {
        status?: IncidentStatus
        location?: { lat: number; lng: number }
      }
    }) => {
      console.log("[v0] Incident update on map:", data)
      setIncidents((prev) =>
        prev.map((incident) => {
          if (incident.id === data.id) {
            return {
              ...incident,
              ...(data.patch.status && { status: data.patch.status }),
              ...(data.patch.location && {
                lat: data.patch.location.lat,
                lng: data.patch.location.lng,
              }),
            }
          }
          return incident
        }),
      )
    }

    const handleUnitUpdate = (data: {
      id: number
      lat?: number
      lng?: number
      status?: string
      last_seen?: string
    }) => {
      console.log("[v0] Unit update on map:", data)
      setUnits((prev) =>
        prev.map((unit) => {
          if (unit.id === data.id) {
            return {
              ...unit,
              ...(data.lat && { lat: data.lat }),
              ...(data.lng && { lng: data.lng }),
              ...(data.status && { status: data.status }),
              ...(data.last_seen && { last_seen: data.last_seen }),
            }
          }
          return unit
        }),
      )
    }

    on("incidents:new", handleNewIncident)
    on("incidents:update", handleIncidentUpdate)
    on("incident:update", handleIncidentUpdate)
    on("units:update", handleUnitUpdate)

    return () => {
      off("incidents:new", handleNewIncident)
      off("incidents:update", handleIncidentUpdate)
      off("incident:update", handleIncidentUpdate)
      off("units:update", handleUnitUpdate)
    }
  }, [on, off, subscribeToOps])

  const getIncidentColor = (status: IncidentStatus, priority?: number) => {
    if (status === "NEW") {
      if (priority && priority >= 3) return "#ef4444" // red-500
      if (priority && priority >= 2) return "#f59e0b" // amber-500
      return "#ef4444" // red-500 for new incidents
    }
    if (status === "ACK") return "#f59e0b" // amber-500
    if (status === "DISPATCHED") return "#3b82f6" // blue-500
    if (status === "IN_PROGRESS") return "#8b5cf6" // violet-500
    return "#6b7280" // gray-500
  }

  const getUnitColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "#10b981" // emerald-500
      case "BUSY":
        return "#f59e0b" // amber-500
      case "OFFLINE":
        return "#6b7280" // gray-500
      default:
        return "#6b7280"
    }
  }

  if (loading) {
    return (
      <Card className="glass-card h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucideMap className="w-5 h-5" />
            Mapa en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando mapa...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <LucideMap className="w-5 h-5" />
          Mapa en Tiempo Real
          <div className="flex gap-2 ml-4">
            <Badge variant="outline" className="bg-red-500/20 text-red-700 border-red-500/30">
              {incidents.filter((i) => i.status === "NEW").length} Nuevos
            </Badge>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
              {incidents.filter((i) => ["DISPATCHED", "IN_PROGRESS"].includes(i.status)).length} Activos
            </Badge>
          </div>
        </CardTitle>
        <div className="flex gap-2">
          <Button variant={showUnits ? "default" : "outline"} size="sm" onClick={() => setShowUnits(!showUnits)}>
            <Layers className="w-4 h-4 mr-1" />
            Unidades
          </Button>
          <Button onClick={loadMapData} variant="ghost" size="sm">
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 rounded-b-2xl overflow-hidden">
          <MapContainer center={defaultCenter} zoom={12} style={{ height: "100%", width: "100%" }} ref={mapRef}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Incident Markers */}
            {incidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.lat, incident.lng]}
                icon={L.divIcon({
                  className: "custom-marker",
                  html: `<div style="background-color: ${getIncidentColor(incident.status, incident.priority)}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">Incidente {incident.id}</p>
                    <p>Estado: {incident.status}</p>
                    <p>Prioridad: {incident.priority || "N/A"}</p>
                    <p className="text-xs text-gray-600">{new Date(incident.created_at).toLocaleString("es-ES")}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Unit Markers */}
            {showUnits &&
              units.map((unit) => (
                <Marker
                  key={`unit-${unit.id}`}
                  position={[unit.lat!, unit.lng!]}
                  icon={L.divIcon({
                    className: "custom-marker",
                    html: `<div style="background-color: ${getUnitColor(unit.status)}; width: 16px; height: 16px; border-radius: 2px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                  })}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{unit.name}</p>
                      <p>Estado: {unit.status}</p>
                      {unit.last_seen && (
                        <p className="text-xs text-gray-600">
                          Última actualización: {new Date(unit.last_seen).toLocaleString("es-ES")}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}
