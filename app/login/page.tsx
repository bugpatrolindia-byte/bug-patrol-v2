"use client"

import { FlaskConical } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"

export default function UserLoginPage() {
  return (
    <LoginForm
      title="Start your reflection space"
      description="Pick up your assessments, track your progress, and return to your personal insights whenever you need them."
      roleLabel="User Login"
      destination="/"
      icon={FlaskConical}
      switchHref="/admin/login"
      switchLabel="Admin login"
      switchText="Managing tests?"
    />
  )
}
