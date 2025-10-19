"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
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
import { User, LogOut, Settings, Wifi, WifiOff, Bell } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Topbar() {
  const { user, logout } = useAuth()
  const [isConnected, setIsConnected] = useState(socketManager.isConnected())

  // Monitor socket connection status
  useState(() => {
    const checkConnection = () => {
      setIsConnected(socketManager.isConnected())
    }

    const interval = setInterval(checkConnection, 1000)
    return () => clearInterval(interval)
  })

  const handleLogout = async () => {
    await logout()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-700 border-red-500/30"
      case "supervisor":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
      case "operator":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30"
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
    <header className="glass-topbar h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-success/20 text-success-foreground border-success/30">
              <Wifi className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground border-destructive/30">
              <WifiOff className="w-3 h-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{user?.email}</p>
                <Badge variant="outline" className={cn("text-xs", getRoleColor(user?.role || ""))}>
                  {getRoleLabel(user?.role || "")}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-border/25">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
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
      </div>
    </header>
  )
}
