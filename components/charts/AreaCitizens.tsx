"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AreaCitizens({ data, xKey, yKey, y2Key }:{
  data: any[]; xKey: string; yKey: string; y2Key: string;
}) {
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip
            labelFormatter={(v) => new Date(v as any).toLocaleDateString('es-GT')}
          />
          <Legend />
          {/* Nuevos por día */}
          <Area type="monotone" name="Nuevos"     dataKey={yKey}  fillOpacity={0.3} strokeWidth={2} />
          {/* Suma acumulada */}
          <Area type="monotone" name="Acumulado"  dataKey={y2Key} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
