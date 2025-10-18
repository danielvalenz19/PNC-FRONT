"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideMap } from "lucide-react"
import { getIncidentsForMap } from "@/lib/ops-map"

/** Util: extrae [lat,lng] tolerando distintas formas */
function pickLatLng(obj: any): [number | null, number | null] {
  const rawLat = obj?.lat ?? obj?.latitude ?? obj?.location?.lat ?? obj?.geo?.lat ?? null
  const rawLng = obj?.lng ?? obj?.longitude ?? obj?.location?.lng ?? obj?.geo?.lng ?? null
  const lat = typeof rawLat === "string" ? parseFloat(rawLat) : rawLat
  const lng = typeof rawLng === "string" ? parseFloat(rawLng) : rawLng
  return [Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null]
}

// Incidentes “visibles” en mapa
const ACTIVE = new Set(["NEW", "ACK", "DISPATCHED", "IN_PROGRESS", "RECOGNIZED", "RECONOCIDO"])

// Avoid SSR for Leaflet usage
const NoSSR = dynamic(() => Promise.resolve(({ children }: any) => children), { ssr: false })

// Color por estado/prioridad
function incidentColor(status?: string, priority?: number) {
  const s = String(status || "").toUpperCase()
  if (s === "NEW") return priority && priority >= 3 ? "#dc2626" : "#ef4444" // rojos
  if (s === "ACK") return "#f59e0b" // ámbar
  if (s === "DISPATCHED") return "#3b82f6" // azul
  if (s === "IN_PROGRESS") return "#8b5cf6" // violeta
  return "#6b7280" // gris
}

// SVG del pin (bonito) con degradado y puntito central
function incidentPinHTML(color: string, label?: string) {
  const safeLabel = label ? String(label) : "!"
  return `
  <div class="leaflet-incident-pin" style="--pin-color:${color}">
    <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="${color}" stop-opacity="1"/>
          <stop offset="100%" stop-color="${color}" stop-opacity=".85"/>
        </linearGradient>
      </defs>
      <!-- pin con borde blanco -->
      <path d="M18 1.5c-7.18 0-13 5.82-13 13 0 9.75 13 28 13 28s13-18.25 13-28c0-7.18-5.82-13-13-13z"
            fill="url(#g)" stroke="white" stroke-width="2" />
      <!-- aro/blanco + centro con el color -->
      <circle cx="18" cy="16" r="7" fill="white" />
      <circle cx="18" cy="16" r="4.5" fill="${color}"/>
      <!-- etiqueta corta (¡, prioridad o lo que quieras) -->
      <text x="18" y="41" text-anchor="middle" font-size="10" fill="white" font-weight="700">${safeLabel}</text>
    </svg>
    <span class="pulse"></span>
  </div>`
}

export default function MapRealtime() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const [Llib, setLlib] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState<any[]>([])

  const defaultCenter = useMemo<[number, number]>(() => [14.6349, -90.5069], []) // Guatemala

  // 1) Cargar Leaflet + CSS (cliente) y arreglar íconos
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const mod = await import("leaflet") // ← sin .default
        // Fix clásico de íconos (rutas en bundlers)
        try {
          const iconUrl = (await import("leaflet/dist/images/marker-icon.png")).default as string
          const iconRetinaUrl = (await import("leaflet/dist/images/marker-icon-2x.png")).default as string
          const shadowUrl = (await import("leaflet/dist/images/marker-shadow.png")).default as string
          mod.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })
        } catch (e) {
          console.warn("[map] Failed to load leaflet marker assets:", e)
        }
        if (alive) setLlib(mod)
      } catch (err) {
        console.warn("[map] Leaflet dynamic import failed:", err)
        if (alive) setLlib(null) // no bloquea el render
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // 2) Cargar snapshot de incidentes (nunca dejar loading en true)
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const list = await getIncidentsForMap(100)
        const onlyActive = list.filter((i: any) => ACTIVE.has(String(i?.status ?? "").toUpperCase()))
        if (alive) setIncidents(onlyActive)
      } catch (e) {
        console.error("[map] incidents fetch error:", e)
        if (alive) setIncidents([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // 3) Montar/actualizar mapa
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // crea el mapa una sola vez
    if (!mapRef.current && Llib) {
      mapRef.current = Llib.map(el, { zoomControl: true, attributionControl: true })
      Llib.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 20,
      }).addTo(mapRef.current)
    }

    // sin Leaflet (error de carga): no bloquear la app
    if (!Llib || !mapRef.current) return

    // limpia marcadores previos
    ;(mapRef.current._layerGroup || (mapRef.current._layerGroup = Llib.layerGroup().addTo(mapRef.current))).clearLayers()

    // coloca marcadores
    const points: [number, number][] = []
    incidents.forEach((inc) => {
      const [lat, lng] = pickLatLng(inc)
      if (lat == null || lng == null) return
      points.push([lat, lng])

      const color = incidentColor(inc?.status, inc?.priority)
      const icon = Llib.divIcon({
        className: "",
        html: incidentPinHTML(color, inc?.priority ? String(inc.priority) : "!"),
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -38],
      })

      Llib.marker([lat, lng], { icon, title: inc?.id ?? "incidente" })
        .addTo(mapRef.current._layerGroup)
        .bindPopup(`<div style="font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto">
          <strong>Incidente ${inc?.id ?? ""}</strong><br/>
          Estado: ${inc?.status ?? "N/A"}${inc?.priority ? ` · Prioridad ${inc.priority}` : ""}<br/>
          ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </div>`)
    })

    // centra/ajusta vista
    if (points.length >= 2) {
      const bounds = Llib.latLngBounds(points)
      mapRef.current.fitBounds(bounds.pad(0.15), { animate: false })
    } else if (points.length === 1) {
      mapRef.current.setView(points[0], 16)
    } else {
      // sin puntos: centra en default
      mapRef.current.setView(defaultCenter, 12)
    }
  }, [Llib, incidents, defaultCenter])

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LucideMap className="w-5 h-5" /> Mapa en Tiempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <NoSSR>
          <div className="map-card">
            {loading ? <div className="map-loading">Cargando mapa…</div> : <div ref={containerRef} className="leaflet-host" />}
          </div>
        </NoSSR>
      </CardContent>
    </Card>
  )
}
