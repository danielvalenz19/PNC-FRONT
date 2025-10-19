"use client"

import { useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { UserStats } from "@/components/users/user-stats"
import { UserList } from "@/components/users/user-list"
import { UserForm } from "@/components/users/user-form"

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "operator" | "supervisor" | "unit"
  status: "active" | "inactive"
  created_at: string
  last_login?: string
  phone?: string
}

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowForm(true)
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedUser(null)
  }

  const handleFormSave = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">Gestión de Personal</h1>
            <p className="text-muted-foreground">Administra el personal del sistema y sus permisos de acceso</p>
          </div>

          <UserStats refreshTrigger={refreshTrigger} />

          <UserList onEditUser={handleEditUser} onCreateUser={handleCreateUser} refreshTrigger={refreshTrigger} />

          <UserForm user={selectedUser} open={showForm} onClose={handleFormClose} onSave={handleFormSave} />
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
