"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface RawRow {
  date?: string; day?: string; bucket?: string; ts?: string;
  ttr_avg?: number | string; ttr_p50?: number | string; ttr?: number | string; response?: number | string;
  tta_avg?: number | string; tta_p50?: number | string; tta?: number | string; arrival?: number | string;
  incidents_count?: number;
}

interface Row {
  date: string;
  ttr_avg: number;   // segundos
  tta_avg: number;   // segundos
  incidents_count: number;
}

interface Props { dateRange: { from: string; to: string } }

// helpers
const toSeconds = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const m = s.match(/(-?\d+(?:\.\d+)?)(s|m|h)$/i);
  if (m) {
    const n = parseFloat(m[1]); const u = m[2].toLowerCase();
    if (u === "h") return n * 3600;
    if (u === "m") return n * 60;
    return n;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const fmtTime = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-ES", { month: "short", day: "numeric" });

// colores con fallback (si no existen las CSS vars o están en HSL sin hsl())
const cssColor = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  if (/^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/.test(raw)) return `hsl(${raw})`;
  return raw;
};

export function ResponseTimeChart({ dateRange }: Props) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);

      const from = new Date(`${dateRange.from}T00:00:00`);
      const to   = new Date(`${dateRange.to}T23:59:59.999`);

      const raw = (await apiClient.getReportsResponseTimes(from.toISOString(), to.toISOString(), "day")) as unknown as RawRow[] | { items: RawRow[] };
      const arr: RawRow[] = Array.isArray(raw) ? raw : (raw?.items ?? []);

      const mapped: Row[] = arr.map((r) => ({
        date: r.bucket ?? r.date ?? r.day ?? r.ts ?? new Date().toISOString(),
        ttr_avg: toSeconds(r.ttr_avg ?? r.ttr_p50 ?? r.ttr ?? r.response ?? 0),
        tta_avg: toSeconds(r.tta_avg ?? r.tta_p50 ?? r.tta ?? r.arrival ?? 0),
        incidents_count: Number(r.incidents_count ?? 0),
      }));

      setData(mapped);
    } catch (e) {
      console.error("reports/response-times error:", e);
      setError("No se pudo cargar la tendencia");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateRange]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Tendencia de Tiempos de Respuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 grid place-items-center text-muted-foreground">Cargando…</div>
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Tendencia de Tiempos de Respuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 grid place-items-center text-muted-foreground">
            {error ?? "No hay datos en el rango seleccionado"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const colorResp = cssColor("--chart-1", "#2563eb");
  const colorArrv = cssColor("--chart-2", "#16a34a");

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Tendencia de Tiempos de Respuesta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={fmtDate} />
              <YAxis tickFormatter={fmtTime} />
              <Tooltip
                labelFormatter={(l) => `Fecha: ${fmtDate(String(l))}`}
                formatter={(v: any, key) => [
                  fmtTime(Number(v)),
                  key === "ttr_avg" ? "Tiempo de Respuesta" : "Tiempo de Llegada",
                ]}
              />
              <Legend />
              <Line type="monotone" dataKey="tta_avg" name="Tiempo de Llegada" stroke={colorArrv} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ttr_avg" name="Tiempo de Respuesta" stroke={colorResp} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}