import { apiClient } from "@/lib/api-client"

export type CitizenRow = {
  id: number
  email: string | null
  phone: string | null
  status: "active" | "inactive"
  created_at: string
  name: string | null
  dpi: string | null
  address: string | null
  incidents_count: number
  last_incident_at: string | null
}

const buildQuery = (params?: Record<string, unknown>) => {
  const p = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return
      p.set(k, String(v))
    })
  }
  const s = p.toString()
  return s ? `?${s}` : ""
}

export const getCitizenStats = (params?: { from?: string; to?: string }) => {
  const qs = buildQuery(params)
  return apiClient.get(`/admin/citizens/stats${qs}`)
}

export const listCitizens = (params: {
  q?: string
  status?: "active" | "inactive"
  page?: number
  limit?: number
}) => {
  const qs = buildQuery(params as any)
  return apiClient.get(`/admin/citizens${qs}`)
}

export const getCitizen = (id: number | string) =>
  apiClient.get(`/admin/citizens/${id}`)

export const updateCitizen = (
  id: number | string,
  data: Partial<{ name: string; email: string; phone: string; address: string }>,
) => apiClient.patch(`/admin/citizens/${id}`, data)

export const updateCitizenStatus = (id: number | string, status: "active" | "inactive") =>
  apiClient.patch(`/admin/citizens/${id}/status`, { status })

export const updateUserRole = (
  id: number | string,
  role: "admin" | "supervisor" | "operator" | "unit" | "citizen",
) => apiClient.patch(`/admin/users/${id}/role`, { role })

