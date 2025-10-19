"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { socketManager } from "@/lib/socket";

export type AlertItem = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  createdAt: number;
  unread?: boolean;
};

type Ctx = {
  alerts: AlertItem[];
  add: (a: AlertItem) => void;
  remove: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

const AlertsCtx = createContext<Ctx | null>(null);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("alerts@panic") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("alerts@panic", JSON.stringify(alerts));
  }, [alerts]);

  // Subscribe to ops real-time events using the existing socket manager
  useEffect(() => {
    // ensure socket is connected; Topbar likely manages this, but connect is safe
    socketManager.connect();
    socketManager.subscribeToOps();

    const handler = (msg: any) => {
      const id = msg?.id?.toString();
      if (!id) return;
      setAlerts((prev) => [
        {
          id,
          title: "Nueva emergencia",
          description: (msg?.lat != null && msg?.lng != null)
            ? `${Number(msg.lat).toFixed(5)}, ${Number(msg.lng).toFixed(5)}`
            : undefined,
          href: `/incidents/${id}`,
          createdAt: Date.now(),
          unread: true,
        },
        ...prev,
      ]);
    };

    socketManager.on("incidents:new", handler as any);
    return () => {
      socketManager.off("incidents:new", handler as any);
    };
  }, []);

  const add = useCallback((a: AlertItem) => setAlerts((p) => [a, ...p]), []);
  const remove = useCallback((id: string) => setAlerts((p) => p.filter((x) => x.id !== id)), []);
  const markAllRead = useCallback(() => setAlerts((p) => p.map((x) => ({ ...x, unread: false }))), []);
  const clear = useCallback(() => setAlerts([]), []);

  const value = useMemo<Ctx>(() => ({ alerts, add, remove, markAllRead, clear }), [alerts, add, remove, markAllRead, clear]);
  return <AlertsCtx.Provider value={value}>{children}</AlertsCtx.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertsCtx);
  if (!ctx) throw new Error("useAlerts debe usarse dentro de AlertsProvider");
  return ctx;
}

