"use client"

import { cn } from "@/lib/utils"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { socketManager } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, Settings, Wifi, WifiOff, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import AlertsPopover from "@/components/notifications/AlertsPopover"
import ProfileModal from "@/components/account/ProfileModal"
import { usePathname, useRouter } from "next/navigation"

interface TopbarProps {
  onOpenMobileMenu?: () => void
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/incidents": "Incidentes",
  "/units": "Unidades",
  "/reports": "Reportes",
  "/audit": "Auditoría",
  "/users": "Personal",
  "/settings": "Configuración",
  "/personas/ciudadanos": "Ciudadanos",
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const { user, logout } = useAuth()
  const [isConnected, setIsConnected] = useState(socketManager.isConnected())
  const [openProfile, setOpenProfile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const pageTitle = useMemo(() => {
    const match = Object.keys(PAGE_TITLES)
      .sort((a, b) => b.length - a.length)
      .find((route) => pathname === route || pathname.startsWith(`${route}/`))
    return match ? PAGE_TITLES[match] : "Panel"
  }, [pathname])

  // Monitor socket connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketManager.isConnected())
    }

    checkConnection()
    const interval = setInterval(checkConnection, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
      case "supervisor":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
      case "operator":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "supervisor":
        return "Supervisor"
      case "operator":
        return "Operador"
      default:
        return role
    }
  }

  return (
    <header className="glass-topbar min-h-16 px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden px-2"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">{pageTitle}</h1>

        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-success/20 text-success-foreground border-success/30">
              <Wifi className="w-3 h-3 mr-1" />
              <span className="hidden lg:inline">Conectado</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground border-destructive/30">
              <WifiOff className="w-3 h-3 mr-1" />
              <span className="hidden lg:inline">Desconectado</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {/* Notifications */}
        <AlertsPopover />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-1 sm:px-2">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium truncate max-w-44">{user?.email}</p>
                <Badge variant="outline" className={cn("text-xs", getRoleColor(user?.role || ""))}>
                  {getRoleLabel(user?.role || "")}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-1.5rem)] glass-card border-border/25">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setOpenProfile(true)}>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ProfileModal open={openProfile} onOpenChange={setOpenProfile} />
      </div>
    </header>
  )
}
