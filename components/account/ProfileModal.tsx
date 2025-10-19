"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export default function ProfileModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!open) return;
      setLoading(true);
      try {
        if (user?.email && user?.role && user?.id && !ignore) setData(user);
        const me = await apiClient.get("/me");
        if (!ignore) setData(me);
      } catch (_) {
        // keep context data if request fails
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [open, user?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mi Perfil</DialogTitle>
        </DialogHeader>

        {loading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Nombre</div>
                <div className="font-medium">{data.full_name ?? "—"}</div>
              </div>
              <Badge variant="secondary">{(data.role ?? "—").toString().toUpperCase()}</Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Correo</div>
                <div className="font-medium break-all">{data.email ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Teléfono</div>
                <div className="font-medium">{data.phone ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estado</div>
                <div className="font-medium">{data.status ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Creado</div>
                <div className="font-medium">
                  {data.created_at ? new Date(data.created_at).toLocaleString("es-GT") : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

