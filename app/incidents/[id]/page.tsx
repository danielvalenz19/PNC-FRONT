import { RouteGuard } from "@/components/auth/route-guard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { IncidentDetail } from "@/components/incidents/incident-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface IncidentDetailPageProps {
  params: {
    id: string
  }
}

export default function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  return (
    <RouteGuard allowedRoles={["admin", "operator", "supervisor"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/incidents">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Incidentes
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-balance">Detalle del Incidente</h1>
              <p className="text-muted-foreground">Información completa y acciones disponibles</p>
            </div>
          </div>

          <IncidentDetail incidentId={params.id} />
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
