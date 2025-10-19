'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getCitizenStats } from '@/lib/api/citizens';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const AreaCitizens = dynamic(() => import('@/components/charts/AreaCitizens'), { ssr: false });

export default function CiudadanosDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getCitizenStats().then(setData).catch(console.error);
  }, []);

  if (!data) return null;

  const n = (v:number)=>v?.toLocaleString('es-GT');

  return (
    <div className="space-y-6">
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
    </div>
  );
}

function Kpi({ title, value }:{title:string; value:any}) {
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent><div className="text-3xl font-semibold">{value}</div></CardContent>
    </Card>
  );
}

