"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RouteGuard } from "@/components/auth/route-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getCitizen, updateCitizen, updateCitizenStatus } from "@/lib/api/citizens";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CiudadanoPerfilPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [data, setData] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const load = () => {
    getCitizen(id)
      .then((res: any) => {
        setData(res);
        setForm({
          name: res.citizen?.name ?? "",
          email: res.citizen?.email ?? "",
          phone: res.citizen?.phone ?? "",
          address: res.citizen?.address ?? "",
        });
      })
      .catch(console.error);
  };

  useEffect(load, [id]);

  const save = async () => {
    await updateCitizen(id, form);
    setEditOpen(false);
    load();
  };

  const toggleStatus = async () => {
    const next = data.citizen.status === "active" ? "inactive" : "active";
    await updateCitizenStatus(id, next);
    load();
  };

  if (!data) {
    return (
      <RouteGuard allowedRoles={["admin", "supervisor"]}>
        <AdminLayout>
          <Card className="glass-card"><CardContent className="p-6">Cargando…</CardContent></Card>
        </AdminLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={["admin", "supervisor"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Perfil del ciudadano</h1>
            <p className="text-muted-foreground">Consulta y edita información del ciudadano.</p>
          </div>

          <Card className="glass-card">
            <CardHeader><CardTitle>Datos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Nombre"   value={data.citizen?.name ?? "—"} />
                <Field label="Correo"   value={data.citizen?.email ?? "—"} />
                <Field label="Teléfono" value={data.citizen?.phone ?? "—"} />
                <Field label="Dirección" value={data.citizen?.address ?? "—"} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setEditOpen(true)}>Editar perfil</Button>
                <Button variant="outline" onClick={toggleStatus}>
                  {data.citizen.status === "active" ? "Bloquear" : "Activar"}
                </Button>
                <Button variant="ghost" onClick={() => router.back()}>Volver</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle>Últimos incidentes</CardTitle></CardHeader>
            <CardContent>
              {data.incidents?.length ? (
                <div className="overflow-auto">
                  <table className="min-w-[700px] w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-3">ID</th>
                        <th className="py-2 pr-3">Estado</th>
                        <th className="py-2 pr-3">Prioridad</th>
                        <th className="py-2 pr-3">Inicio</th>
                        <th className="py-2 pr-3">Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.incidents.map((i: any) => (
                        <tr key={i.id} className="border-b">
                          <td className="py-2 pr-3">{i.id}</td>
                          <td className="py-2 pr-3">{i.status}</td>
                          <td className="py-2 pr-3">{i.priority ?? "—"}</td>
                          <td className="py-2 pr-3">{i.started_at ? new Date(i.started_at).toLocaleString("es-GT") : "—"}</td>
                          <td className="py-2 pr-3">{i.ended_at ? new Date(i.ended_at).toLocaleString("es-GT") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : 'Sin incidentes'}
            </CardContent>
          </Card>

          {/* Dialog de edición */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Editar perfil</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nombre</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1"><Label>Correo</Label>
                  <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1"><Label>Teléfono</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2"><Label>Dirección</Label>
                  <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Guardar cambios</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </RouteGuard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}
