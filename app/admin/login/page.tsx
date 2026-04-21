"use client"

import { Shield } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"

export default function AdminLoginPage() {
  return (
    <LoginForm
      title="Open the facilitator console"
      description="Create assessments, review participation, and keep the psychometric experience organized."
      roleLabel="Admin Login"
      destination="/admin"
      icon={Shield}
      switchHref="/login"
      switchLabel="User login"
      switchText="Taking an assessment?"
    />
  )
}
