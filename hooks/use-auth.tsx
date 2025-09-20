"use client"

import type React from "react"
import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { apiClient } from "@/lib/api"
import type { UserRole } from "@/lib/config"

export interface User {
  user_id: number
  role: UserRole
  email?: string
  must_change: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  hasRole: (role: string | string[]) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    try {
      console.log("[v0] Loading user...")
      const currentUser = await apiClient.getCurrentUser()
      console.log("[v0] Current user loaded:", currentUser)
      setUser(
        currentUser
          ? {
              ...currentUser,
              role: currentUser.role as UserRole,
            }
          : null,
      )
      console.log("[v0] User loaded: success")
    } catch (error) {
      console.log("[v0] Get current user failed:", error instanceof Error ? error.message : "Unknown error")
      setUser(null)
      console.log("[v0] User loaded: failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true)
      try {
        console.log("[v0] Starting login process...")
        console.log("[v0] AuthProvider: Starting login...")

        const response = await apiClient.login(email, password)
        console.log("[v0] Login successful, tokens received:", {
          hasAccessToken: !!response.accessToken,
          role: response.role,
          mustChange: response.must_change,
        })

        // Load user data after successful login
        console.log("[v0] AuthProvider: Login successful, loading user...")
        await loadUser()

        // Check if password change is required
        if (response.must_change) {
          console.log("[v0] Password change required, redirecting...")
          if (typeof window !== "undefined") {
            window.location.href = "/change-password"
          }
          return
        }

        console.log("[v0] Redirecting to dashboard...")
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard"
        }
      } catch (error) {
        console.log("[v0] Login error:", error instanceof Error ? error.message : "Login failed")
        throw error
      } finally {
        setLoading(false)
      }
    },
    [loadUser],
  )

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await apiClient.logout()
      setUser(null)
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await apiClient.changePassword(currentPassword, newPassword)
    // After password change, tokens are revoked, redirect to login
    setUser(null)
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }, [])

  const isAuthenticated = !!user
  const hasRole = useCallback(
    (role: string | string[]) => {
      if (!user) return false
      if (Array.isArray(role)) {
        return role.includes(user.role)
      }
      return user.role === role
    },
    [user],
  )

  const value = {
    user,
    loading,
    isAuthenticated,
    hasRole,
    login,
    logout,
    changePassword,
    refreshUser: loadUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
