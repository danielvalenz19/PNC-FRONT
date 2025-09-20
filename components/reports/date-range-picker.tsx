"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, RefreshCw } from "lucide-react"

interface DateRangePickerProps {
  dateRange: {
    from: string
    to: string
  }
  onDateRangeChange: (range: { from: string; to: string }) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [localRange, setLocalRange] = useState(dateRange)

  const handleApply = () => {
    onDateRangeChange(localRange)
  }

  const handlePreset = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)

    const newRange = {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    }

    setLocalRange(newRange)
    onDateRangeChange(newRange)
  }

  const presets = [
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
  ]

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Rango de fechas:</span>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="from" className="text-sm">
              Desde:
            </Label>
            <Input
              id="from"
              type="date"
              value={localRange.from}
              onChange={(e) => setLocalRange({ ...localRange, from: e.target.value })}
              className="w-auto bg-input/40 backdrop-blur-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="to" className="text-sm">
              Hasta:
            </Label>
            <Input
              id="to"
              type="date"
              value={localRange.to}
              onChange={(e) => setLocalRange({ ...localRange, to: e.target.value })}
              className="w-auto bg-input/40 backdrop-blur-sm"
            />
          </div>

          <Button onClick={handleApply} size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Aplicar
          </Button>

          <div className="flex gap-2 ml-auto">
            {presets.map((preset) => (
              <Button key={preset.days} variant="outline" size="sm" onClick={() => handlePreset(preset.days)}>
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
