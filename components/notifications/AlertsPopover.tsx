"use client";

import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlerts } from "./useAlerts";

export default function AlertsPopover() {
  const { alerts, remove, markAllRead, clear } = useAlerts();
  const router = useRouter();
  const unread = alerts.filter((a) => a.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full p-2 hover:bg-muted transition" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-sm font-medium">Alertas</div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              Marcar leídas
            </Button>
            <Button size="sm" variant="ghost" onClick={clear}>
              Limpiar
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">Sin alertas</div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-3 py-2 hover:bg-muted/50 transition">
                <div className={`mt-1 h-2 w-2 rounded-full ${a.unread ? "bg-red-500" : "bg-muted-foreground/40"}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.title}</div>
                  {a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}
                  {a.href && (
                    <button onClick={() => router.push(a.href!)} className="text-xs text-primary hover:underline mt-1">
                      Ver detalle
                    </button>
                  )}
                </div>
                <button className="p-1 hover:bg-muted rounded" onClick={() => remove(a.id)} aria-label="Eliminar">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

