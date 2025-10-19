"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  AlertTriangle,
  Car,
  BarChart3,
  FileText,
  Settings,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "operator", "supervisor"],
  },
  {
    name: "Incidentes",
    href: "/incidents",
    icon: AlertTriangle,
    roles: ["admin", "operator", "supervisor"],
  },
  {
    name: "Unidades",
    href: "/units",
    icon: Car,
    roles: ["admin", "operator", "supervisor"],
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: BarChart3,
    roles: ["admin", "operator", "supervisor"],
  },
  {
    name: "Auditoría",
    href: "/audit",
    icon: FileText,
    roles: ["admin", "supervisor"],
  },
  {
    name: "Personal",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "Ciudadanos",
    href: "/personas/ciudadanos",
    icon: Users,
    roles: ["admin", "supervisor"],
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { hasRole } = useAuth()

  const filteredItems = navigationItems.filter((item) => hasRole(item.roles))

  return (
    <aside
      className={cn(
        "glass-sidebar h-screen sticky top-0 transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border/25">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-sidebar-foreground">PNC Panic</h2>
                <p className="text-sm text-sidebar-foreground/70">Portal Admin</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-sidebar-accent/20 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
                      "hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg",
                      collapsed && "justify-center",
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
