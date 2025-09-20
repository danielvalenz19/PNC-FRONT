"use client"

import type React from "react"

import { useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { socketManager } from "@/lib/socket"
import { useAuth } from "@/hooks/use-auth"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      socketManager.connect()
    }

    return () => {
      socketManager.disconnect()
    }
  }, [isAuthenticated])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
