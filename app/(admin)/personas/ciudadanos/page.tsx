'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { RouteGuard } from '@/components/auth/route-guard';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getCitizenStats, listCitizens, updateCitizenStatus, updateUserRole } from '@/lib/api/citizens';

// chart client-only
const AreaCitizens = dynamic(() => import('@/components/charts/AreaCitizens'), { ssr: false });

type CitizenRow = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'active' | 'inactive';
  incidents_count: number;
  last_incident_at?: string | null;
};

export default function CiudadanosPage() {
  return (
    <RouteGuard allowedRoles={['admin', 'supervisor']}>
      <AdminLayout>
        <div className="space-y-6">
          <Header />

          <TopKPIsAndChart />

          <CitizenTable />
        </div>
      </AdminLayout>
    </RouteGuard>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground text-balance">Ciudadanos</h1>
      <p className="text-muted-foreground">Métricas, crecimiento y gestión de ciudadanos en una sola vista.</p>
    </div>
  );
}

/* ---------- KPIs + CHART ---------- */
function TopKPIsAndChart() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    getCitizenStats().then(setData).catch(console.error);
  }, []);

  if (!data) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="glass-card"><CardContent className="h-24 animate-pulse" /></Card>
      ))}
    </div>
  );

  const n = (v: number) => v?.toLocaleString('es-GT');

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi title="Total" value={n(data.kpis.total_ciudadanos)} />
        <Kpi title="Activos" value={n(data.kpis.ciudadanos_activos)} />
        <Kpi title="Bloqueados" value={n(data.kpis.ciudadanos_bloqueados)} />
        <Kpi title="Nuevos (30d)" value={n(data.kpis.nuevos_30d)} />
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Crecimiento diario</CardTitle></CardHeader>
        <CardContent>
          <AreaCitizens data={data.series} xKey="d" yKey="n" y2Key="acumulado" />
        </CardContent>
      </Card>
    </>
  );
}

function Kpi({ title, value }: { title: string; value: any }) {
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent><div className="text-3xl font-semibold">{value}</div></CardContent>
    </Card>
  );
}

/* ---------- LISTADO/ACCIONES ---------- */
function CitizenTable() {
  const [rows, setRows] = useState<CitizenRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = () => {
    listCitizens({ q: q || undefined, status, page, limit })
      .then((res: any) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch(console.error);
  };

  useEffect(load, [q, status, page]);

  const toggleStatus = async (id: number, curr: 'active' | 'inactive') => {
    await updateCitizenStatus(id, curr === 'active' ? 'inactive' : 'active');
    load();
  };

  const setRole = async (id: number, role: 'admin' | 'supervisor' | 'operator' | 'unit' | 'citizen') => {
    await updateUserRole(id, role);
    load();
  };

  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Buscar por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select onValueChange={(v) => setStatus(v as any)} value={status}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => { setQ(''); setStatus(undefined); setPage(1); }}>Limpiar</Button>
        </div>

        {/* Tabla */}
        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Teléfono</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Incidentes</th>
                <th className="py-2 pr-3">Último incidente</th>
                <th className="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-3">{r.name || '—'}</td>
                  <td className="py-2 pr-3">{r.email || '—'}</td>
                  <td className="py-2 pr-3">{r.phone || '—'}</td>
                  <td className="py-2 pr-3">{r.status}</td>
                  <td className="py-2 pr-3">{r.incidents_count}</td>
                  <td className="py-2 pr-3">
                    {r.last_incident_at ? new Date(r.last_incident_at).toLocaleString('es-GT') : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2">
                      <Link href={`/personas/ciudadanos/${r.id}`}><Button size="sm">Ver</Button></Link>
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(r.id, r.status)}>
                        {r.status === 'active' ? 'Bloquear' : 'Activar'}
                      </Button>
                      <Select onValueChange={(v) => setRole(r.id, v as any)}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Asignar rol" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="citizen">citizen</SelectItem>
                          <SelectItem value="unit">unit</SelectItem>
                          <SelectItem value="operator">operator</SelectItem>
                          <SelectItem value="supervisor">supervisor</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-6 text-center text-muted-foreground" colSpan={7}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm">Total: {total.toLocaleString('es-GT')}</div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" disabled={(page * limit) >= total} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
