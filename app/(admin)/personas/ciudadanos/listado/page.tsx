'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCitizens, type CitizenRow, updateCitizenStatus, updateUserRole } from '@/lib/api/citizens';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

export default function CiudadanosListadoPage() {
  const [rows, setRows] = useState<CitizenRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState<string>('');
  const [status, setStatus] = useState<'active'|'inactive'|undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = () => {
    listCitizens({ q: q || undefined, status, page, limit }).then((res:any)=>{
      setRows(res.items);
      setTotal(res.total);
    }).catch(console.error);
  };

  useEffect(load, [q, status, page]);

  const toggleStatus = async (id:number, curr:'active'|'inactive') => {
    await updateCitizenStatus(id, curr === 'active' ? 'inactive' : 'active');
    load();
  };

  const setRole = async (id:number, role:'admin'|'supervisor'|'operator'|'unit'|'citizen') => {
    await updateUserRole(id, role);
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader><CardTitle>Ciudadanos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Buscar por nombre o email…" value={q} onChange={e=>setQ(e.target.value)} className="max-w-xs" />
            <Select onValueChange={(v)=>setStatus(v as any)} value={status}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={()=>{ setQ(''); setStatus(undefined); setPage(1); }}>Limpiar</Button>
          </div>

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
                {rows.map(r=>((
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
                        <Button size="sm" variant="outline" onClick={()=>toggleStatus(r.id, r.status)}>
                          {r.status === 'active' ? 'Bloquear' : 'Activar'}
                        </Button>
                        <Select onValueChange={(v)=>setRole(r.id, v as any)}>
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
                )))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm">Total: {total.toLocaleString('es-GT')}</div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</Button>
              <Button variant="outline" disabled={(page*limit)>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

