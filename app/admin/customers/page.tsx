"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Building2, History, Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

type CustomerType = "Hotel" | "Cafe" | "Other"
type VisitFrequency = "Monthly" | "Twice per month" | "Three times per month" | "Custom"
const unassignedStaffValue = "unassigned"

interface Customer {
  id: string
  business_name: string
  customer_type: CustomerType
  address: string
  contact_person: string | null
  phone: string | null
  email: string | null
  location_url: string | null
  visit_frequency: VisitFrequency
  custom_schedule: string | null
  assigned_staff_id: string | null
  staff_profiles: {
    full_name: string
  } | null
  is_active: boolean
}

interface StaffOption {
  id: string
  full_name: string
}

interface CustomerVisit {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: "Scheduled" | "In Progress" | "Completed"
  remarks: string | null
  staff_profiles: { full_name: string } | null
  visit_chemical_usages: {
    quantity_used: number
    chemicals: { name: string; unit: string } | null
  }[]
}

interface CustomerFormState {
  businessName: string
  customerType: CustomerType
  address: string
  contactPerson: string
  phone: string
  email: string
  locationUrl: string
  visitFrequency: VisitFrequency
  customSchedule: string
  assignedStaffId: string
}

const emptyForm: CustomerFormState = {
  businessName: "",
  customerType: "Other",
  address: "",
  contactPerson: "",
  phone: "",
  email: "",
  locationUrl: "",
  visitFrequency: "Monthly",
  customSchedule: "",
  assignedStaffId: "",
}

export default function AdminCustomersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [form, setForm] = useState<CustomerFormState>(emptyForm)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToRemove, setCustomerToRemove] = useState<Customer | null>(null)
  const [customerForHistory, setCustomerForHistory] = useState<Customer | null>(null)
  const [customerVisits, setCustomerVisits] = useState<CustomerVisit[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.is_active).length,
    [customers]
  )

  useEffect(() => {
    void loadCustomers()
    void loadStaffOptions()
  }, [])

  async function loadCustomers() {
    setIsLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const { data, error: customersError } = await supabase
      .from("customers")
      .select("*, staff_profiles(full_name)")
      .order("business_name", { ascending: true })

    if (customersError) {
      setError(`${customersError.message}. Run supabase/schema.sql in Supabase SQL Editor if this is the first setup.`)
      setCustomers([])
    } else {
      setCustomers((data ?? []) as Customer[])
    }

    setIsLoading(false)
  }

  async function loadStaffOptions() {
    const supabase = createSupabaseBrowserClient()
    const { data, error: staffError } = await supabase
      .from("staff_profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name", { ascending: true })

    if (staffError) {
      setError(`${staffError.message}. Run the latest supabase/schema.sql in Supabase SQL Editor.`)
      setStaffOptions([])
    } else {
      setStaffOptions((data ?? []) as StaffOption[])
    }
  }

  function openCreateDialog() {
    setEditingCustomer(null)
    setForm(emptyForm)
    setError("")
    setDialogOpen(true)
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer)
    setForm({
      businessName: customer.business_name,
      customerType: customer.customer_type,
      address: customer.address,
      contactPerson: customer.contact_person ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      locationUrl: customer.location_url ?? "",
      visitFrequency: customer.visit_frequency,
      customSchedule: customer.custom_schedule ?? "",
      assignedStaffId: customer.assigned_staff_id ?? "",
    })
    setError("")
    setDialogOpen(true)
  }

  async function openHistoryDialog(customer: Customer) {
    setCustomerForHistory(customer)
    setCustomerVisits([])
    setHistoryDialogOpen(true)
    setIsHistoryLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const { data, error: historyError } = await supabase
      .from("visits")
      .select("id, scheduled_date, scheduled_time, status, remarks, staff_profiles(full_name), visit_chemical_usages(quantity_used, chemicals(name, unit))")
      .eq("customer_id", customer.id)
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false })

    if (historyError) {
      setError(historyError.message)
    } else {
      setCustomerVisits((data ?? []) as CustomerVisit[])
    }

    setIsHistoryLoading(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.businessName.trim() || !form.address.trim()) {
      setError("Business name and address are required.")
      return
    }

    setIsSaving(true)
    setError("")

    const payload = {
      business_name: form.businessName.trim(),
      customer_type: form.customerType,
      address: form.address.trim(),
      contact_person: cleanOptional(form.contactPerson),
      phone: cleanOptional(form.phone),
      email: cleanOptional(form.email),
      location_url: cleanOptional(form.locationUrl),
      visit_frequency: form.visitFrequency,
      custom_schedule: form.visitFrequency === "Custom" ? cleanOptional(form.customSchedule) : null,
      assigned_staff_id: cleanOptional(form.assignedStaffId),
    }

    const supabase = createSupabaseBrowserClient()
    const request = editingCustomer
      ? supabase.from("customers").update(payload).eq("id", editingCustomer.id)
      : supabase.from("customers").insert(payload)

    const { error: saveError } = await request

    if (saveError) {
      setError(saveError.message)
    } else {
      setDialogOpen(false)
      await loadCustomers()
    }

    setIsSaving(false)
  }

  async function toggleCustomer(customer: Customer) {
    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase
      .from("customers")
      .update({ is_active: !customer.is_active })
      .eq("id", customer.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadCustomers()
  }

  async function removeCustomer() {
    if (!customerToRemove) {
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerToRemove.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setCustomerToRemove(null)
    await loadCustomers()
  }

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Customer Management" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-5 lg:p-6">
          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
            <SummaryCard title="Total Customers" value={customers.length.toString()} />
            <SummaryCard title="Active Customers" value={activeCustomers.toString()} />
            <SummaryCard title="Inactive Customers" value={(customers.length - activeCustomers).toString()} />
          </div>

          <Card className="border-border bg-card py-4">
            <CardHeader className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Customers</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add customer details and visit frequency for scheduling.
                </p>
              </div>
              <Button onClick={openCreateDialog} className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Customer
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
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <Building2 className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No customers yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add your first hotel, cafe, or other customer.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Assigned Staff</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="max-w-64">
                            <p className="font-medium">{customer.business_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{customer.address}</p>
                          </div>
                        </TableCell>
                        <TableCell>{customer.customer_type}</TableCell>
                        <TableCell>
                          <div>
                            <p>{customer.contact_person || "-"}</p>
                            <p className="text-xs text-muted-foreground">{customer.phone || customer.email || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{customer.staff_profiles?.full_name ?? "Unassigned"}</TableCell>
                        <TableCell>{customer.visit_frequency}</TableCell>
                        <TableCell>
                          <Badge variant={customer.is_active ? "default" : "secondary"}>
                            {customer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void openHistoryDialog(customer)}
                              aria-label={`View visit history for ${customer.business_name}`}
                              title="View visit history"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(customer)}
                              aria-label={`Edit ${customer.business_name}`}
                              title="Edit customer"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleCustomer(customer)}
                              aria-label={`${customer.is_active ? "Disable" : "Enable"} ${customer.business_name}`}
                              title={customer.is_active ? "Disable customer" : "Enable customer"}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setCustomerToRemove(customer)}
                              aria-label={`Remove ${customer.business_name}`}
                              title="Remove customer"
                            >
                              <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              Store customer details now. Scheduling and visit history will build on this record later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" htmlFor="businessName">
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(event) => setForm({ ...form, businessName: event.target.value })}
                  placeholder="Green Leaf Cafe"
                />
              </Field>

              <Field label="Customer type" htmlFor="customerType">
                <Select
                  value={form.customerType}
                  onValueChange={(value: CustomerType) => setForm({ ...form, customerType: value })}
                >
                  <SelectTrigger id="customerType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hotel">Hotel</SelectItem>
                    <SelectItem value="Cafe">Cafe</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Address" htmlFor="address">
              <Textarea
                id="address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                placeholder="Street, area, city"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Contact person" htmlFor="contactPerson">
                <Input
                  id="contactPerson"
                  value={form.contactPerson}
                  onChange={(event) => setForm({ ...form, contactPerson: event.target.value })}
                  placeholder="Manager name"
                />
              </Field>
              <Field label="Phone" htmlFor="phone">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+91..."
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="contact@example.com"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location link" htmlFor="locationUrl">
                <Input
                  id="locationUrl"
                  value={form.locationUrl}
                  onChange={(event) => setForm({ ...form, locationUrl: event.target.value })}
                  placeholder="Google Maps URL"
                />
              </Field>
              <Field label="Assigned staff" htmlFor="assignedStaff">
                <Select
                  value={form.assignedStaffId || unassignedStaffValue}
                  onValueChange={(value) => {
                    setForm({
                      ...form,
                      assignedStaffId: value === unassignedStaffValue ? "" : value,
                    })
                  }}
                >
                  <SelectTrigger id="assignedStaff" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={unassignedStaffValue}>Unassigned</SelectItem>
                    {staffOptions.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Visit frequency" htmlFor="visitFrequency">
                <Select
                  value={form.visitFrequency}
                  onValueChange={(value: VisitFrequency) => setForm({ ...form, visitFrequency: value })}
                >
                  <SelectTrigger id="visitFrequency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Twice per month">Twice per month</SelectItem>
                    <SelectItem value="Three times per month">Three times per month</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {form.visitFrequency === "Custom" && (
              <Field label="Custom schedule" htmlFor="customSchedule">
                <Textarea
                  id="customSchedule"
                  value={form.customSchedule}
                  onChange={(event) => setForm({ ...form, customSchedule: event.target.value })}
                  placeholder="Example: Every Monday morning, or 1st and 15th"
                />
              </Field>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCustomer ? "Save Changes" : "Add Customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{customerForHistory?.business_name ?? "Customer"} visit history</DialogTitle>
            <DialogDescription>Review scheduled work, assigned staff, remarks, and chemical usage.</DialogDescription>
          </DialogHeader>

          {isHistoryLoading ? (
            <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading visit history...
            </div>
          ) : customerVisits.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No visits recorded for this customer yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chemicals</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div className="whitespace-nowrap">
                          <p>{formatVisitDate(visit.scheduled_date)}</p>
                          <p className="text-xs text-muted-foreground">{formatVisitTime(visit.scheduled_time)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{visit.staff_profiles?.full_name ?? "Unassigned"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{visit.status}</Badge>
                      </TableCell>
                      <TableCell>{formatVisitChemicals(visit.visit_chemical_usages)}</TableCell>
                      <TableCell className="max-w-56 text-sm text-muted-foreground">{visit.remarks ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(customerToRemove)} onOpenChange={(open) => !open && setCustomerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {customerToRemove?.business_name ?? "this customer"} from customer management.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeCustomer}
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
            >
              Remove Customer
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

function formatVisitDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatVisitTime(time: string) {
  const [hours = "00", minutes = "00"] = time.split(":")
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatVisitChemicals(usages: CustomerVisit["visit_chemical_usages"]) {
  if (usages.length === 0) {
    return "-"
  }

  return usages
    .map((usage) => {
      const name = usage.chemicals?.name ?? "Unknown"
      const unit = usage.chemicals?.unit ?? ""

      return `${name} (${Number(usage.quantity_used).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}${unit ? ` ${unit}` : ""})`
    })
    .join(", ")
}
