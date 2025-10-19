"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SystemSettings } from "@/components/settings/system-settings"
import { SimulationPanel } from "@/components/settings/simulation-panel"
import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"

export default function SettingsPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Administra la configuración del sistema y ejecuta simulaciones</p>
          </div>

          <Tabs defaultValue="system" className="space-y-6">
            <TabsList className="glass-card">
              <TabsTrigger value="system">Sistema</TabsTrigger>
              <TabsTrigger value="simulations">Simulaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="system">
              <SystemSettings />
            </TabsContent>

            <TabsContent value="simulations">
              <SimulationPanel />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
