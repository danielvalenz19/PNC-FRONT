import { apiClient } from "@/lib/api-client"

// Snapshot para el mapa (los mismos incidentes que ves en la Cola)
export async function getIncidentsForMap(limit = 100) {
  const data = await apiClient.get<any>(`/api/v1/ops/incidents?limit=${limit}`)
  // tolera array directo o {items:[...]}
  return Array.isArray(data) ? data : data?.items ?? []
}

