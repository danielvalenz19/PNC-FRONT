'use client'

import { useEffect, useRef, useState } from 'react'

type SimStatus = {
  running: boolean
  startedAt?: string
  endsAt?: string
  area?: string
  type?: string
  targetCount?: number
  created: number
}

export default function SimulationPanel() {
  const [status, setStatus] = useState<SimStatus>({ running: false, created: 0 })
  const [area, setArea] = useState('centro')
  const [count, setCount] = useState(5)
  const [minutes, setMinutes] = useState(60)
  const [note, setNote] = useState('')
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // SSE
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || ''
  const url = `${base}/api/v1/simulations/events`
    const es = new EventSource(url, { withCredentials: true } as any)
    esRef.current = es
    es.addEventListener('status', (e: any) => setStatus(JSON.parse(e.data)))
    es.addEventListener('started', (e: any) => setStatus(s => ({ ...s, ...JSON.parse(e.data), running: true })))
    es.addEventListener('progress', (e: any) => {
      const data = JSON.parse((e as MessageEvent).data)
      setStatus(s => ({ ...s, created: data.created, running: true }))
    })
    es.addEventListener('stopped', (e: any) => setStatus(s => ({ ...s, running: false })))
    es.onerror = () => {
      /* ignore in dev */
    }
    return () => {
      try {
        es.close()
      } catch (e) {
        // ignore
      }
    }
  }, [])

  async function start() {
  await fetch(`/api/v1/simulations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'emergency', duration_minutes: minutes, count, area, note }),
    })
  }
  async function stop() {
  await fetch(`/api/v1/simulations/stop`, { method: 'POST' })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Área</label>
          <select className="w-full border rounded p-2" value={area} onChange={e => setArea(e.target.value)}>
            <option value="centro">Centro</option>
            <option value="norte">Norte</option>
            <option value="sur">Sur</option>
            <option value="oriente">Oriente</option>
            <option value="occidente">Occidente</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Incidentes a generar</label>
          <input type="number" className="w-full border rounded p-2" value={count} onChange={e => setCount(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm">Duración (min)</label>
          <input type="number" className="w-full border rounded p-2" value={minutes} onChange={e => setMinutes(Number(e.target.value))} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Descripción</label>
          <textarea className="w-full border rounded p-2" rows={2} value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-4 py-2 rounded bg-blue-700 text-white disabled:opacity-50"
          onClick={start}
          disabled={status.running}
        >
          ▶ Iniciar simulación
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-200"
          onClick={stop}
          disabled={!status.running}
        >
          ■ Detener
        </button>
        <div className="text-sm text-muted-foreground">
          {status.running ? 'Ejecutándose…' : 'Detenida'} · Generados: <b>{status.created}</b>
        </div>
      </div>
    </div>
  )
}
