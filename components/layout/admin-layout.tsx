"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { socketManager } from "@/lib/socket"
import { useAuth } from "@/hooks/use-auth"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated } = useAuth()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      socketManager.connect()
    }

    return () => {
      socketManager.disconnect()
    }
  }, [isAuthenticated])

  return (
    <div className="flex min-h-screen md:h-screen bg-background overflow-hidden">
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
