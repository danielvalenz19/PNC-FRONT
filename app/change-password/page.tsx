import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { RouteGuard } from "@/components/auth/route-guard"

export default function ChangePasswordPage() {
  return (
    <RouteGuard>
      <ChangePasswordForm />
    </RouteGuard>
  )
}
