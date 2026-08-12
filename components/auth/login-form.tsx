"use client"

import { FormEvent, useState } from "react"
import { ArrowRight, LockKeyhole, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserRole } from "@/lib/auth/roles"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface LoginFormProps {
  title: string
  description: string
}

export function LoginForm({
  title,
  description,
}: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Enter both email and password to continue.")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const signedInRole = getUserRole(data.user)

      if (!signedInRole) {
        await supabase.auth.signOut()
        setError("This account does not have a staff or admin role.")
        return
      }

      const nextPath = new URLSearchParams(window.location.search).get("next")
      const roleHome = signedInRole === "admin" ? "/admin" : "/"
      const safeNextPath = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null
      const canUseNextPath =
        signedInRole === "admin"
          ? safeNextPath === "/admin" || Boolean(safeNextPath?.startsWith("/admin/"))
          : safeNextPath === "/" || safeNextPath === "/history" || safeNextPath === "/profile"
      const destination = canUseNextPath && safeNextPath ? safeNextPath : roleHome

      window.location.assign(destination)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,121,107,0.10)_0,rgba(0,121,107,0.10)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-56 w-56 rounded-full bg-secondary/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="hidden lg:block">
          <div className="h-[520px] bg-[url('/login-people.svg')] bg-contain bg-center bg-no-repeat opacity-90" />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 bg-card pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 bg-card pl-10"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="h-11 w-full gap-2 shadow-sm">
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
