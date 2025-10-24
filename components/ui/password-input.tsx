"use client"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

type Props = React.ComponentProps<typeof Input> & { toggleAriaLabel?: string }

export function PasswordInput({ toggleAriaLabel = "Mostrar u ocultar contraseña", className, ...props }: Props) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={`pr-10 ${className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={toggleAriaLabel}
        className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default PasswordInput
