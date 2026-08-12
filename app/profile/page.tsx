"use client"

import { FormEvent, useEffect, useState } from "react"
import { BriefcaseBusiness, Loader2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react"

import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface StaffProfile {
  full_name: string
  email: string
  phone: string | null
  job_title: string | null
  is_active: boolean
}

export default function StaffProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [authEmail, setAuthEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [error, setError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    setIsLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError(userError?.message ?? "Unable to load signed-in staff user.")
      setIsLoading(false)
      return
    }

    setAuthEmail(user.email ?? "")

    const { data, error: profileError } = await supabase
      .from("staff_profiles")
      .select("full_name, email, phone, job_title, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (profileError) {
      setError(profileError.message)
      setProfile(null)
    } else if (!data) {
      setError("No staff profile is linked to this login user.")
      setProfile(null)
    } else {
      setProfile(data as StaffProfile)
    }

    setIsLoading(false)
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }

    setIsUpdatingPassword(true)

    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setPasswordError(updateError.message)
    } else {
      setNewPassword("")
      setConfirmPassword("")
      setPasswordSuccess("Password updated successfully.")
    }

    setIsUpdatingPassword(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64">
        <Navbar
          title="Profile"
          subtitle="Your staff account and contact details"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-3 sm:p-5 lg:p-6">
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {isLoading ? (
            <Card className="border-border bg-card py-4">
              <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading profile...
              </CardContent>
            </Card>
          ) : profile ? (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="overflow-hidden border-border bg-card py-0 shadow-sm">
                <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 to-white px-5 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                        {getInitials(profile.full_name)}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight">{profile.full_name}</h2>
                        <p className="text-sm text-muted-foreground">{profile.job_title || "Staff member"}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={profile.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                      {profile.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                  <ProfileDetail icon={UserRound} label="Full name" value={profile.full_name} />
                  <ProfileDetail icon={BriefcaseBusiness} label="Job title" value={profile.job_title || "Staff member"} />
                  <ProfileDetail icon={Mail} label="Profile email" value={profile.email} />
                  <ProfileDetail icon={Mail} label="Login email" value={authEmail || "-"} />
                  <ProfileDetail icon={Phone} label="Phone" value={profile.phone || "-"} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card py-4 shadow-sm">
                <CardHeader className="px-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LockKeyhole className="h-4 w-4 text-primary" />
                    Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                  <form onSubmit={handlePasswordUpdate} className="grid gap-4">
                    <p className="text-sm text-muted-foreground">
                      Update your login password. You will stay signed in after changing it.
                    </p>

                    {passwordError && (
                      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {passwordError}
                      </p>
                    )}

                    {passwordSuccess && (
                      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {passwordSuccess}
                      </p>
                    )}

                    <Field label="New password" htmlFor="newPassword">
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Enter new password"
                      />
                    </Field>

                    <Field label="Confirm password" htmlFor="confirmPassword">
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </Field>

                    <Button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-border bg-card py-4">
              <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                No profile details available.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="break-words text-sm font-medium">{value}</p>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}
