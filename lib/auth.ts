import { API_CONFIG, AUTH_CONFIG, type UserRole } from "./config"

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  role: UserRole
  must_change?: boolean
}

export interface User {
  user_id: string
  role: UserRole
  email?: string
  must_change?: boolean
}

export class AuthManager {
  private static instance: AuthManager

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  getTokens(): AuthTokens | null {
    if (typeof window === "undefined") return null

    const accessToken = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)
    const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
    const role = localStorage.getItem(AUTH_CONFIG.USER_ROLE_KEY) as UserRole

    if (!accessToken || !refreshToken || !role) return null

    return { accessToken, refreshToken, role }
  }

  setTokens(tokens: AuthTokens): void {
    if (typeof window === "undefined") return

    localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refreshToken)
    localStorage.setItem(AUTH_CONFIG.USER_ROLE_KEY, tokens.role)
    if (tokens.must_change !== undefined) {
      localStorage.setItem("pnc_must_change", tokens.must_change.toString())
    }
  }

  clearTokens(): void {
    if (typeof window === "undefined") return

    localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
    localStorage.removeItem(AUTH_CONFIG.USER_ROLE_KEY)
    localStorage.removeItem("pnc_must_change")
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    console.log("[v0] Making login request to:", `${API_CONFIG.BASE_URL}/auth/login`)

    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ email, password }),
    })

    console.log("[v0] Login response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Login failed:", errorText)
      throw new Error("Login failed")
    }

    const tokens = await response.json()
    console.log("[v0] Login response data:", {
      hasAccessToken: !!tokens.accessToken,
      role: tokens.role,
      mustChange: tokens.must_change,
    })

    this.setTokens(tokens)
    return tokens
  }

  async refreshToken(): Promise<string | null> {
    const tokens = this.getTokens()
    if (!tokens) return null

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })

      if (!response.ok) {
        this.clearTokens()
        return null
      }

      const { accessToken } = await response.json()
      localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken)
      return accessToken
    } catch (error) {
      this.clearTokens()
      return null
    }
  }

  async logout(): Promise<void> {
    const tokens = this.getTokens()
    if (tokens) {
      try {
        await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        })
      } catch (error) {
        console.error("Logout error:", error)
      }
    }
    this.clearTokens()
  }

  async getCurrentUser(): Promise<User | null> {
    const tokens = this.getTokens()
    if (!tokens) return null

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!response.ok) {
        console.error("[v0] Get current user failed:", response.status)
        return null
      }

      const user = await response.json()
      console.log("[v0] Current user loaded:", { userId: user.user_id, role: user.role })
      return user
    } catch (error) {
      console.error("[v0] Get current user error:", error)
      return null
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const tokens = this.getTokens()
    if (!tokens) throw new Error("Not authenticated")

    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })

    if (!response.ok) {
      throw new Error("Password change failed")
    }
  }
}
