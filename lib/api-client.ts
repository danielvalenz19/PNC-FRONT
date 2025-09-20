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

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const tokens = this.authManager.getTokens()
    const url = `${API_CONFIG.BASE_URL}${endpoint}`

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(tokens && { Authorization: `Bearer ${tokens.accessToken}` }),
        ...options.headers,
      },
    }

    try {
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

          return retryResponse.status === 204 ? null : await retryResponse.json()
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.status === 204 ? null : await response.json()
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
}

export const apiClient = ApiClient.getInstance()
