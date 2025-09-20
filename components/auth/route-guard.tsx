"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/lib/config"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireAuth?: boolean
}

export function RouteGuard({
  children,
  allowedRoles = ["admin", "operator", "supervisor"],
  requireAuth = true,
}: RouteGuardProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/"]
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!requireAuth && isPublicRoute) {
      return
    }

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Check if user must change password
    if (user?.must_change && pathname !== "/change-password") {
      router.push("/change-password")
      return
    }

    // Check role permissions
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push("/dashboard") // Redirect to dashboard if no permission
      return
    }

    // Redirect authenticated users away from login page
    if (isAuthenticated && pathname === "/login") {
      router.push("/dashboard")
    }
  }, [user, loading, isAuthenticated, router, pathname, allowedRoles, requireAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show login page for unauthenticated users on protected routes
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // Show access denied for users without proper roles
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground mb-4">No tienes permisos para acceder a esta página.</p>
          <button onClick={() => router.push("/dashboard")} className="text-primary hover:underline">
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
