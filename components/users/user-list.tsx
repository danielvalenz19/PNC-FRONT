"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"
import { Users, Search, Plus, Edit, Clock, Mail, RotateCcw, Power, PowerOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type RawUser = any
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

interface UserListProps {
  onEditUser: (user: User) => void
  onCreateUser: () => void
  refreshTrigger: number
}

export function UserList({ onEditUser, onCreateUser, refreshTrigger }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { on, off, subscribeToOps } = useSocket()
  const { toast } = useToast()

  const normalizeUser = (u: RawUser): User => ({
    id: (u?.id ?? u?.user_id) as number,
    email: u?.email ?? "",
    name: (u?.full_name ?? u?.name ?? "") as string,
    phone: (u?.phone ?? u?.tel ?? "") as string,
    role: (u?.role ?? "operator") as User["role"],
    status: ((u?.status ?? (u?.active ? "active" : "inactive")) as "active" | "inactive") || "inactive",
    created_at: (u?.created_at ?? u?.createdAt ?? new Date().toISOString()) as string,
    last_login: (u?.last_login ?? u?.lastLogin) as string | undefined,
  })

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.getUsers({
        q: searchQuery || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        limit: 20,
      })

      // Normalize shape and pagination
      if (Array.isArray(response)) {
        const items = response.map(normalizeUser)
        setUsers(items)
        setTotalPages(1)
      } else {
        const resp: any = response
        const data: RawUser[] = resp?.data ?? resp?.items ?? []
        const items = data.map(normalizeUser)
        const meta = resp?.meta ?? { page: currentPage, limit: 20, total: items.length }
        setUsers(items)
        setTotalPages(Math.max(1, Math.ceil((meta.total || items.length) / (meta.limit || 20))))
      }
    } catch (err) {
      setError("Error al cargar usuarios")
      console.error("[v0] Failed to load users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (user: User) => {
    try {
      const response = await apiClient.resetUserPassword(user.id)

      if (response && typeof response === "object" && "tempPassword" in response) {
        toast({
          title: "Contraseña restablecida",
          description: `Nueva contraseña temporal para ${user.name}: ${response.tempPassword}`,
          duration: 10000,
        })
      } else {
        toast({
          title: "Contraseña restablecida",
          description: `Se ha restablecido la contraseña de ${user.name}`,
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al restablecer la contraseña",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === "active" ? "inactive" : "active"
      await apiClient.updateUserStatus(user.id, newStatus)

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)))

      toast({
        title: "Estado actualizado",
        description: `${user.name} ahora está ${newStatus === "active" ? "activo" : "inactivo"}`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al cambiar el estado del usuario",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadUsers()
  }, [roleFilter, statusFilter, refreshTrigger, currentPage])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadUsers()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    subscribeToOps()

    const handleUserUpdate = (data: {
      id?: number
      user_id?: number
      name?: string
      full_name?: string
      email?: string
      role?: "admin" | "operator" | "supervisor" | "unit"
      status?: "active" | "inactive"
      last_login?: string
    }) => {
      console.log("[v0] User update received:", data)
      setUsers((prev) =>
        prev.map((user) => {
          const incomingId = (data.id ?? (data as any).user_id) as number | undefined
          if (incomingId && user.id === incomingId) {
            return {
              ...user,
              ...(data.full_name && { name: data.full_name }),
              ...(data.name && { name: data.name }),
              ...(data.email && { email: data.email }),
              ...(data.role && { role: data.role }),
              ...(data.status && { status: data.status }),
              ...(data.last_login && { last_login: data.last_login }),
            }
          }
          return user
        }),
      )
    }

  on("users:update" as any, handleUserUpdate)

    return () => {
  off("users:update" as any, handleUserUpdate)
    }
  }, [on, off, subscribeToOps])

  useEffect(() => {
    setFilteredUsers(users)
  }, [users])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-700 border-purple-500/30"
      case "supervisor":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30"
      case "operator":
        return "bg-green-500/20 text-green-700 border-green-500/30"
      case "unit":
        return "bg-orange-500/20 text-orange-700 border-orange-500/30"
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
      case "unit":
        return "Unidad"
      default:
        return role
    }
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestión de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestión de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadUsers} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestión de Usuarios
          <Badge variant="outline" className="ml-2">
            {filteredUsers.length}
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="ghost" size="sm">
            Actualizar
          </Button>
          <Button onClick={onCreateUser} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Usuario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input/40 backdrop-blur-sm"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="bg-input/40 backdrop-blur-sm">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent className="glass-card border-border/25">
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="operator">Operador</SelectItem>
              <SelectItem value="unit">Unidad</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-input/40 backdrop-blur-sm">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="glass-card border-border/25">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No se encontraron usuarios</p>
            <p className="text-sm">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Aún no hay usuarios registrados"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors border border-border/25"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.status === "inactive" && (
                      <Badge variant="outline" className="bg-gray-500/20 text-gray-700 border-gray-500/30">
                        Inactivo
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{user.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <span>📞 {user.phone}</span>
                        </div>
                      )}
                      {user.last_login && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Último acceso:{" "}
                            {formatDistanceToNow(new Date(user.last_login), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Creado: {new Date(user.created_at).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPassword(user)}
                    title="Restablecer contraseña"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(user)}
                    title={user.status === "active" ? "Desactivar usuario" : "Activar usuario"}
                  >
                    {user.status === "active" ? (
                      <PowerOff className="w-4 h-4 text-red-600" />
                    ) : (
                      <Power className="w-4 h-4 text-green-600" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditUser(user)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
