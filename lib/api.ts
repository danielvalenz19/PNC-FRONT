import { API_CONFIG, API_ENDPOINTS, REQUEST_HEADERS, AUTH_CONFIG } from "./config"

class ApiClient {
  private baseURL: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.loadTokensFromStorage()
  }

  private loadTokensFromStorage() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)
      this.refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
    }
  }

  private saveTokensToStorage(accessToken: string, refreshToken?: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken)
      if (refreshToken) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
      }
    }
    this.accessToken = accessToken
    if (refreshToken) {
      this.refreshToken = refreshToken
    }
  }

  private clearTokensFromStorage() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
      localStorage.removeItem(AUTH_CONFIG.USER_ROLE_KEY)
    }
    this.accessToken = null
    this.refreshToken = null
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      console.log("[v0] Attempting to refresh access token...")
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.REFRESH}`, {
        method: "POST",
        headers: REQUEST_HEADERS,
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.saveTokensToStorage(data.accessToken)
        console.log("[v0] Access token refreshed successfully")
        return true
      } else {
        console.log("[v0] Refresh token expired or invalid")
        this.clearTokensFromStorage()
        return false
      }
    } catch (error) {
      console.error("[v0] Error refreshing token:", error)
      this.clearTokensFromStorage()
      return false
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers = {
      ...REQUEST_HEADERS,
      ...options.headers,
    }

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`
    }

    console.log(`[v0] Making API request to: ${url}`)

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      })

      // If 401 and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken) {
        console.log("[v0] Got 401, attempting token refresh...")
        const refreshed = await this.refreshAccessToken()

        if (refreshed) {
          // Retry the original request with new token
          headers["Authorization"] = `Bearer ${this.accessToken}`
          response = await fetch(url, {
            ...options,
            headers,
          })
        } else {
          // Refresh failed, redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          throw new Error("Authentication failed")
        }
      }

      const contentType = response.headers.get("content-type")

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`

        if (contentType?.includes("application/json")) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            errorMessage = await response.text()
          }
        } else {
          errorMessage = await response.text()
        }

        console.error(`[v0] API request failed: ${errorMessage}`)
        throw new Error(errorMessage)
      }

      if (contentType?.includes("application/json")) {
        const data = await response.json()
        console.log(`[v0] API request successful:`, data)
        return data
      } else {
        const text = await response.text()
        console.log(`[v0] API request returned text:`, text)
        return text as unknown as T
      }
    } catch (error) {
      console.error(`[v0] API request error:`, error)
      throw error
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request<{
      accessToken: string
      refreshToken: string
      role: string
      must_change: boolean
    }>(API_ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    this.saveTokensToStorage(data.accessToken, data.refreshToken)

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_CONFIG.USER_ROLE_KEY, data.role)
    }

    return data
  }

  async logout() {
    if (this.refreshToken) {
      try {
        await this.request(API_ENDPOINTS.LOGOUT, {
          method: "POST",
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        })
      } catch (error) {
        console.error("[v0] Logout error:", error)
      }
    }
    this.clearTokensFromStorage()
  }

  async getCurrentUser() {
    return this.request<{
      user_id: number
      role: string
      email?: string
      must_change: boolean
    }>(API_ENDPOINTS.ME)
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.request(API_ENDPOINTS.CHANGE_PASSWORD, {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
    // After password change, tokens are revoked
    this.clearTokensFromStorage()
  }

  // Ops methods
  async getIncidents(params?: {
    status?: string
    from?: string
    to?: string
    q?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `${API_ENDPOINTS.OPS_INCIDENTS}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    return this.request<{
      items: any[]
      page: number
      total: number
    }>(endpoint)
  }

  async getIncidentDetail(id: string) {
    return this.request(API_ENDPOINTS.OPS_INCIDENT_DETAIL(id))
  }

  async ackIncident(id: string) {
    return this.request(API_ENDPOINTS.OPS_INCIDENT_ACK(id), {
      method: "PATCH",
    })
  }

  async assignIncident(id: string, unitId: string, note?: string) {
    return this.request(API_ENDPOINTS.OPS_INCIDENT_ASSIGN(id), {
      method: "PATCH",
      body: JSON.stringify({ unit_id: unitId, note }),
    })
  }

  async updateIncidentStatus(id: string, status: string, reason?: string) {
    return this.request(API_ENDPOINTS.OPS_INCIDENT_STATUS(id), {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    })
  }

  async addIncidentNote(id: string, text: string) {
    return this.request(API_ENDPOINTS.OPS_INCIDENT_NOTES(id), {
      method: "POST",
      body: JSON.stringify({ text }),
    })
  }

  async getUnits(params?: { status?: string; type?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value)
        }
      })
    }

    const endpoint = `${API_ENDPOINTS.OPS_UNITS}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    return this.request<any[]>(endpoint)
  }

  async createUnit(data: {
    name: string
    type: "patrol" | "moto" | "ambulance"
    plate?: string
    active: boolean
  }) {
    return this.request(API_ENDPOINTS.OPS_UNITS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateUnit(
    id: string,
    data: Partial<{
      name: string
      type: "patrol" | "moto" | "ambulance"
      plate: string
      active: boolean
      status: string
    }>,
  ) {
    return this.request(API_ENDPOINTS.OPS_UNIT_DETAIL(id), {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getKPIs(from?: string, to?: string) {
    const searchParams = new URLSearchParams()
    if (from) searchParams.append("from", from)
    if (to) searchParams.append("to", to)

    const endpoint = `${API_ENDPOINTS.OPS_REPORTS_KPIS}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    return this.request(endpoint)
  }

  // Admin methods
  async getUsers(params?: {
    q?: string
    role?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `${API_ENDPOINTS.ADMIN_USERS}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    return this.request(endpoint)
  }

  async createUser(data: {
    email: string
    name: string
    role: string
    phone?: string
  }) {
    return this.request(API_ENDPOINTS.ADMIN_CREATE_USER, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async resetUserPassword(id: number) {
    return this.request(API_ENDPOINTS.ADMIN_RESET_PASSWORD(id), {
      method: "POST",
    })
  }

  async updateUserStatus(id: number, status: "active" | "inactive") {
    return this.request(API_ENDPOINTS.ADMIN_UPDATE_STATUS(id), {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }

  // Settings and Audit
  async getSettings() {
    return this.request(API_ENDPOINTS.OPS_SETTINGS)
  }

  async updateSettings(
    data: Partial<{
      countdown_seconds: number
      ping_interval_seconds: number
      data_retention_days: number
      sla_ack_seconds: number
    }>,
  ) {
    return this.request(API_ENDPOINTS.OPS_SETTINGS, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getAuditLogs(params?: {
    from?: string
    to?: string
    action?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `${API_ENDPOINTS.OPS_AUDIT}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    return this.request(endpoint)
  }

  // Simulations
  async createSimulation() {
    return this.request<{ id: string; status: string }>(API_ENDPOINTS.SIMULATIONS, {
      method: "POST",
    })
  }

  async updateSimulationStatus(id: string, status: "PAUSED" | "RUNNING" | "CLOSED") {
    return this.request(API_ENDPOINTS.SIMULATION_STATUS(id), {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }
}

export const apiClient = new ApiClient()
