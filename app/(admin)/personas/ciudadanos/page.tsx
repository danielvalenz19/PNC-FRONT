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
import { getCitizenStats, listCitizens, updateCitizenStatus, createCitizen } from '@/lib/api/citizens';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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

  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card"><CardContent className="h-24 animate-pulse" /></Card>
        ))}
      </div>
    );
  }

  // Normalize possible API shapes to avoid runtime errors when kpis is missing
  const kraw = data?.kpis ?? data?.data?.kpis ?? {};
  const safe = {
    total: Number(kraw.total_ciudadanos ?? data?.total_ciudadanos ?? data?.total ?? 0) || 0,
    activos: Number(kraw.ciudadanos_activos ?? data?.ciudadanos_activos ?? data?.activos ?? 0) || 0,
    bloqueados: Number(
      kraw.ciudadanos_bloqueados ?? data?.ciudadanos_bloqueados ?? data?.bloqueados ?? data?.blocked ?? 0,
    ) || 0,
    nuevos30: Number(kraw.nuevos_30d ?? data?.nuevos_30d ?? data?.new_30d ?? data?.nuevos ?? 0) || 0,
    series: (data?.series ?? data?.data?.series ?? data?.items ?? []) as any[],
  };
  const n = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString('es-GT');

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi title="Total" value={n(safe.total)} />
        <Kpi title="Activos" value={n(safe.activos)} />
        <Kpi title="Bloqueados" value={n(safe.bloqueados)} />
        <Kpi title="Nuevos (30d)" value={n(safe.nuevos30)} />
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Crecimiento diario</CardTitle></CardHeader>
        <CardContent>
          <AreaCitizens data={safe.series} xKey="d" yKey="n" y2Key="acumulado" />
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

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", email: "", phone: "", address: "", dpi: "", password: ""
  });

  const load = () => {
    listCitizens({ q: q || undefined, status, page, limit })
      .then((res: any) => {
        const items: CitizenRow[] = Array.isArray(res) ? res : (res?.items ?? []);
        setRows(items);
        setTotal(res?.total ?? items.length ?? 0);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      });
  };

  useEffect(load, [q, status, page]);

  const toggleStatus = async (id: number, curr: 'active' | 'inactive') => {
    await updateCitizenStatus(id, curr === 'active' ? 'inactive' : 'active');
    load();
  };

  const submitCreate = async () => {
    await createCitizen(createForm); // el backend fuerza role='citizen'
    setCreateOpen(false);
    setCreateForm({ name: "", email: "", phone: "", address: "", dpi: "", password: "" });
    load();
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap items-center">
            <Input placeholder="Buscar por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <Select onValueChange={(v) => setStatus(v as any)} value={status}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={() => { setQ(''); setStatus(undefined); setPage(1); }}>Limpiar</Button>
            <div className="grow" />
            <Button onClick={() => setCreateOpen(true)}>Crear ciudadano</Button>
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
                    <td className="py-2 pr-3">{r.last_incident_at ? new Date(r.last_incident_at).toLocaleString('es-GT') : '—'}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <Link href={`/personas/ciudadanos/${r.id}`}><Button size="sm">Ver</Button></Link>
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(r.id, r.status)}>
                          {r.status === 'active' ? 'Bloquear' : 'Activar'}
                        </Button>
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

      {/* Modal Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nuevo ciudadano</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nombre</Label>
              <Input value={createForm.name} onChange={e=>setCreateForm({...createForm,name:e.target.value})}/>
            </div>
            <div className="space-y-1"><Label>Correo</Label>
              <Input type="email" value={createForm.email} onChange={e=>setCreateForm({...createForm,email:e.target.value})}/>
            </div>
            <div className="space-y-1"><Label>Teléfono</Label>
              <Input value={createForm.phone} onChange={e=>setCreateForm({...createForm,phone:e.target.value})}/>
            </div>
            <div className="space-y-1"><Label>DPI</Label>
              <Input value={createForm.dpi} onChange={e=>setCreateForm({...createForm,dpi:e.target.value})}/>
            </div>
            <div className="space-y-1 md:col-span-2"><Label>Dirección</Label>
              <Input value={createForm.address} onChange={e=>setCreateForm({...createForm,address:e.target.value})}/>
            </div>
            <div className="space-y-1 md:col-span-2"><Label>Contraseña inicial</Label>
              <Input type="password" value={createForm.password} onChange={e=>setCreateForm({...createForm,password:e.target.value})}/>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={submitCreate}>Crear</Button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            *El nuevo usuario se crea con rol <b>citizen</b> por defecto.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
