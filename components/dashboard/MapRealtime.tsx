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
      Llib.marker([lat, lng], {
        title: inc?.id ?? "incidente",
      }).addTo(mapRef.current._layerGroup)
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

