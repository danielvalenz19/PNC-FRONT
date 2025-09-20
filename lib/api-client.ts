import { API_CONFIG } from "./config"
import { AuthManager } from "./auth"

export class ApiClient {
  private static instance: ApiClient
  private authManager: AuthManager
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: any) => void
  }> = []

  constructor() {
    this.authManager = AuthManager.getInstance()
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  private async processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token!)
      }
    })

    this.failedQueue = []
  }

  private async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject })
      })
    }

    this.isRefreshing = true

    try {
      const newToken = await this.authManager.refreshToken()
      if (!newToken) {
        throw new Error("Token refresh failed")
      }

      this.processQueue(null, newToken)
      return newToken
    } catch (error) {
      this.processQueue(error, null)
      throw error
    } finally {
      this.isRefreshing = false
    }
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const tokens = this.authManager.getTokens()
    // Normalize endpoint: ensure it is prefixed with /api/v1 when caller passes /ops/... or /reports/...
    let ep = endpoint
    if (!ep.startsWith("/api/")) {
      ep = `/api/v1${ep.startsWith("/") ? "" : "/"}${ep}`
    }
    const url = `${API_CONFIG.BASE_URL}${ep}`

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(tokens && { Authorization: `Bearer ${tokens.accessToken}` }),
        ...options.headers,
      },
    }

    try {
      console.log(`[api-client] Requesting: ${url}`)
      const response = await fetch(url, config)

      if (response.status === 401 && tokens) {
        try {
          const newToken = await this.handleTokenRefresh()

          // Retry original request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          }

          const retryResponse = await fetch(url, retryConfig)
          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`)
          }

          return (retryResponse.status === 204 ? (undefined as T) : ((await retryResponse.json()) as T))
        } catch (refreshError) {
          // Refresh failed, redirect to login
          this.authManager.clearTokens()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          throw refreshError
        }
      }

      if (!response.ok) {
        // If 404, attempt some safe fallbacks to handle backend route differences
        if (response.status === 404) {
          // 1) /api/v1/reports/* -> /api/v1/ops/reports/* (existing behavior)
          if (ep.startsWith("/api/v1/reports/")) {
            const altEp = ep.replace("/api/v1/reports/", "/api/v1/ops/reports/")
            const altUrl = `${API_CONFIG.BASE_URL}${altEp}`
            console.log(`[api-client] 404 received, retrying on ${altUrl}`)
            const altResponse = await fetch(altUrl, config)
            if (altResponse.ok) {
              return (altResponse.status === 204
                ? (undefined as T)
                : ((await altResponse.json()) as T))
            }
          }

          // 2) /api/v1/ops/... -> try without /ops/ (some backends expose non-ops routes)
          if (ep.startsWith("/api/v1/ops/")) {
            const altEp = ep.replace("/api/v1/ops/", "/api/v1/")
            const altUrl = `${API_CONFIG.BASE_URL}${altEp}`
            console.log(`[api-client] 404 received, retrying on ${altUrl}`)
            const altResponse = await fetch(altUrl, config)
            if (altResponse.ok) {
              return (altResponse.status === 204
                ? (undefined as T)
                : ((await altResponse.json()) as T))
            }
          }
        }

        // Try to extract response body for a more informative error
        let bodyText: string | null = null
        try {
          bodyText = await response.text()
        } catch (e) {
          /* ignore */
        }

        console.error(`[api-client] Request failed: ${url} -> ${response.status} ${response.statusText}`, bodyText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}${bodyText ? ` - ${bodyText}` : ""}`)
      }

  return (response.status === 204 ? (undefined as T) : ((await response.json()) as T))
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Convenience methods
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  // Added convenience alias for PUT used in settings
  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // --- Helpers for query strings
  private buildQuery(params?: Record<string, unknown>) {
    const p = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return
        if (k === "status" && String(v).includes(",")) return // backend no acepta CSV en status
        p.set(k, String(v))
      })
    }
    const s = p.toString()
    return s ? `?${s}` : ""
  }

  // --- OPS endpoints (subset needed by dashboard)
  getIncidents(params?: {
    status?: string
    q?: string
    from?: string
    to?: string
    page?: number
    limit?: number
  }): Promise<{ items: any[]; page: number; total: number }> {
    const qs = this.buildQuery(params)
    return this.get(`/api/v1/ops/incidents${qs}`)
  }

  getUnits(params?: { status?: string; type?: string }): Promise<any[]> {
    const qs = this.buildQuery(params)
    return this.get(`/api/v1/ops/units${qs}`)
  }

  getKPIs(from?: string, to?: string) {
    const p = new URLSearchParams()
    if (from) p.append("from", from)
    if (to) p.append("to", to)
    const qs = p.toString() ? `?${p.toString()}` : ""
    return this.get(`/api/v1/ops/reports/kpis${qs}`)
  }
}

export const apiClient = ApiClient.getInstance()
