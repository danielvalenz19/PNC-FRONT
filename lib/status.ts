// INCIDENTES (referencia interna)
export const INCIDENT_STATUS = {
  NEW: "NEW",
  ACK: "ACK",
  DISPATCHED: "DISPATCHED",
  IN_PROGRESS: "IN_PROGRESS",
  CLOSED: "CLOSED",
  CANCELED: "CANCELED",
} as const

// UNIDADES (tokens válidos que acepta el backend)
export const UNIT_STATUS = {
  available: "available",
  en_route: "en_route",
  on_site: "on_site",
  out_of_service: "out_of_service",
} as const

// Normaliza etiquetas humanas o variantes a un token válido de unidad o null
export function normalizeUnitStatus(input?: string | null): string | null {
  if (!input) return null
  const s = String(input).toLowerCase().trim()

  if (["available", "disponible"].includes(s)) return UNIT_STATUS.available
  if (["en_route", "en ruta", "en-ruta", "ruta"].includes(s)) return UNIT_STATUS.en_route
  if (["on_site", "en sitio", "en-sitio", "sitio"].includes(s)) return UNIT_STATUS.on_site
  if (["out_of_service", "fuera de servicio", "fuera-servicio", "fuera"].includes(s)) return UNIT_STATUS.out_of_service

  // Cualquier otro valor no es válido para unidades
  return null
}

