"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react"

import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface StaffProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  job_title: string | null
  is_active: boolean
}

interface StaffFormState {
  fullName: string
  email: string
  password: string
  phone: string
  jobTitle: string
}

const emptyForm: StaffFormState = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  jobTitle: "",
}

export default function AdminStaffPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([])
  const [form, setForm] = useState<StaffFormState>(emptyForm)
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null)
  const [staffToRemove, setStaffToRemove] = useState<StaffProfile | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const activeStaff = useMemo(
    () => staffProfiles.filter((staff) => staff.is_active).length,
    [staffProfiles]
  )

  useEffect(() => {
    void loadStaffProfiles()
  }, [])

  async function loadStaffProfiles() {
    setIsLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const { data, error: staffError } = await supabase
      .from("staff_profiles")
      .select("id, full_name, email, phone, job_title, is_active")
      .order("full_name", { ascending: true })

    if (staffError) {
      setError(`${staffError.message}. Run the latest supabase/schema.sql in Supabase SQL Editor.`)
      setStaffProfiles([])
    } else {
      setStaffProfiles((data ?? []) as StaffProfile[])
    }

    setIsLoading(false)
  }

  function openCreateDialog() {
    setEditingStaff(null)
    setForm(emptyForm)
    setError("")
    setDialogOpen(true)
  }

  function openEditDialog(staff: StaffProfile) {
    setEditingStaff(staff)
    setForm({
      fullName: staff.full_name,
      email: staff.email,
      password: "",
      phone: staff.phone ?? "",
      jobTitle: staff.job_title ?? "",
    })
    setError("")
    setDialogOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Full name and email are required.")
      return
    }

    if (!editingStaff && form.password.length < 8) {
      setError("A staff password must be at least 8 characters.")
      return
    }

    setIsSaving(true)
    setError("")

    const payload = {
      full_name: form.fullName.trim(),
      email: editingStaff ? editingStaff.email : form.email.trim().toLowerCase(),
      phone: cleanOptional(form.phone),
      job_title: cleanOptional(form.jobTitle),
    }

    let saveError: string | null = null

    if (editingStaff) {
      const supabase = createSupabaseBrowserClient()
      const { error: updateError } = await supabase
        .from("staff_profiles")
        .update(payload)
        .eq("id", editingStaff.id)
      saveError = updateError?.message ?? null
    } else {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: payload.full_name,
          email: payload.email,
          password: form.password,
          phone: payload.phone,
          jobTitle: payload.job_title,
        }),
      })
      const result = (await response.json()) as { error?: string }
      saveError = response.ok ? null : result.error ?? "Unable to create the staff account."
    }

    if (saveError) {
      setError(saveError)
    } else {
      setDialogOpen(false)
      await loadStaffProfiles()
    }

    setIsSaving(false)
  }

  async function toggleStaff(staff: StaffProfile) {
    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase
      .from("staff_profiles")
      .update({ is_active: !staff.is_active })
      .eq("id", staff.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadStaffProfiles()
  }

  async function removeStaff() {
    if (!staffToRemove) {
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { error: deleteError } = await supabase
      .from("staff_profiles")
      .delete()
      .eq("id", staffToRemove.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setStaffToRemove(null)
    await loadStaffProfiles()
  }

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Staff Management" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-5 lg:p-6">
          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
            <SummaryCard title="Total Staff" value={staffProfiles.length.toString()} />
            <SummaryCard title="Active Staff" value={activeStaff.toString()} />
            <SummaryCard title="Disabled Staff" value={(staffProfiles.length - activeStaff).toString()} />
          </div>

          <Card className="border-border bg-card py-4">
            <CardHeader className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Staff Accounts</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage staff profile records before assigning customers and schedules.
                </p>
              </div>
              <Button onClick={openCreateDialog} className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            </CardHeader>
            <CardContent className="px-4">
              {error && (
                <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading staff...
                </div>
              ) : staffProfiles.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <UserRound className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No staff profiles yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add staff records after creating staff auth users.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffProfiles.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.full_name}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>{staff.phone || "-"}</TableCell>
                        <TableCell>{staff.job_title || "Staff"}</TableCell>
                        <TableCell>
                          <Badge variant={staff.is_active ? "default" : "secondary"}>
                            {staff.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(staff)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleStaff(staff)}>
                              {staff.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setStaffToRemove(staff)}>
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add Staff"}</DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "Update the staff profile details below. The login email and password are managed separately."
                : "Create the staff login and profile together. Give the email and password to the staff member."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName">
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  placeholder="Staff name"
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  disabled={Boolean(editingStaff)}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="staff@example.com"
                />
              </Field>
            </div>

            {!editingStaff && (
              <Field label="Login password" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">Save this password before sharing the login details.</p>
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" htmlFor="phone">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+91..."
                />
              </Field>
              <Field label="Job title" htmlFor="jobTitle">
                <Input
                  id="jobTitle"
                  value={form.jobTitle}
                  onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
                  placeholder="Technician"
                />
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingStaff ? "Save Changes" : "Add Staff"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(staffToRemove)} onOpenChange={(open) => !open && setStaffToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove staff profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {staffToRemove?.full_name ?? "this staff profile"} from staff management.
              This does not delete the Supabase Auth login user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeStaff}
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
            >
              Remove Staff
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border bg-card py-3 shadow-sm">
      <CardHeader className="px-4 pb-1">
        <CardTitle className="truncate text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="text-2xl font-semibold leading-none">{value}</div>
      </CardContent>
    </Card>
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

function cleanOptional(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}
