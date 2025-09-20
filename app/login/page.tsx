import { LoginForm } from "@/components/auth/login-form"
import { RouteGuard } from "@/components/auth/route-guard"

export default function LoginPage() {
  return (
    <RouteGuard requireAuth={false}>
      <LoginForm />
    </RouteGuard>
  )
}
