"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { CalendarClock, ChevronLeft, ChevronRight, Filter, Loader2, Pencil, Plus } from "lucide-react"

import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
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
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface CustomerOption {
  id: string
  business_name: string
  assigned_staff_id: string | null
}

interface StaffOption {
  id: string
  full_name: string
}

interface Visit {
  id: string
  customer_id: string
  staff_id: string | null
  scheduled_date: string
  scheduled_time: string
  status: "Scheduled" | "In Progress" | "Completed"
  remarks: string | null
  customers: {
    business_name: string
    address: string
  } | null
  staff_profiles: {
    full_name: string
  } | null
  visit_chemical_usages: {
    quantity_used: number
    chemicals: {
      name: string
      unit: string
    } | null
  }[]
}

interface ScheduleFormState {
  customerId: string
  staffId: string
  scheduledDate: string
  scheduledTime: string
}

const emptyForm: ScheduleFormState = {
  customerId: "",
  staffId: "",
  scheduledDate: "",
  scheduledTime: "",
}

const statusFilters = ["All", "Scheduled", "In Progress", "Completed"] as const
type StatusFilter = (typeof statusFilters)[number]
const calendarWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function AdminSchedulesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [visits, setVisits] = useState<Visit[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [form, setForm] = useState<ScheduleFormState>(emptyForm)
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [staffFilter, setStaffFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const todayVisitCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)

    return visits.filter((visit) => visit.scheduled_date === today).length
  }, [visits])

  const statusCounts = useMemo(() => {
    return {
      scheduled: visits.filter((visit) => visit.status === "Scheduled").length,
      inProgress: visits.filter((visit) => visit.status === "In Progress").length,
      completed: visits.filter((visit) => visit.status === "Completed").length,
    }
  }, [visits])

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const matchesStatus = statusFilter === "All" || visit.status === statusFilter
      const matchesStaff =
        staffFilter === "all" || (staffFilter === "unassigned" ? !visit.staff_id : visit.staff_id === staffFilter)
      const matchesDate = !dateFilter || visit.scheduled_date === dateFilter

      return matchesStatus && matchesStaff && matchesDate
    })
  }, [dateFilter, staffFilter, statusFilter, visits])

  const scheduleConflict = useMemo(() => {
    if (!form.staffId || !form.scheduledDate || !form.scheduledTime) {
      return null
    }

    return (
      visits.find(
        (visit) =>
          visit.id !== editingVisit?.id &&
          visit.staff_id === form.staffId &&
          visit.scheduled_date === form.scheduledDate &&
          visit.scheduled_time.slice(0, 5) === form.scheduledTime
      ) ?? null
    )
  }, [editingVisit, form.scheduledDate, form.scheduledTime, form.staffId, visits])

  const calendarCells = useMemo(() => {
    const firstDay = calendarMonth.getDay()
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()

    return Array.from({ length: firstDay + daysInMonth }, (_, index) => {
      if (index < firstDay) {
        return null
      }

      return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - firstDay + 1)
    })
  }, [calendarMonth])

  const visitCountByDate = useMemo(() => {
    return visits.reduce<Record<string, number>>((counts, visit) => {
      counts[visit.scheduled_date] = (counts[visit.scheduled_date] ?? 0) + 1
      return counts
    }, {})
  }, [visits])

  useEffect(() => {
    void loadPageData()
  }, [])

  useEffect(() => {
    const requestedStaff = new URLSearchParams(window.location.search).get("staff")

    if (requestedStaff) {
      setStaffFilter(requestedStaff)
    }
  }, [])

  async function loadPageData() {
    setIsLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const [visitsResult, customersResult, staffResult] = await Promise.all([
      supabase
        .from("visits")
        .select(
          "id, customer_id, staff_id, scheduled_date, scheduled_time, status, remarks, customers(business_name, address), staff_profiles(full_name), visit_chemical_usages(quantity_used, chemicals(name, unit))"
        )
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true }),
      supabase
        .from("customers")
        .select("id, business_name, assigned_staff_id")
        .eq("is_active", true)
        .order("business_name", { ascending: true }),
      supabase
        .from("staff_profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
    ])

    if (visitsResult.error) {
      setError(`${visitsResult.error.message}. Run the latest supabase/schema.sql in Supabase SQL Editor.`)
      setVisits([])
    } else {
      setVisits((visitsResult.data ?? []) as Visit[])
    }

    if (customersResult.error) {
      setError(customersResult.error.message)
      setCustomers([])
    } else {
      setCustomers((customersResult.data ?? []) as CustomerOption[])
    }

    if (staffResult.error) {
      setError(staffResult.error.message)
      setStaffOptions([])
    } else {
      setStaffOptions((staffResult.data ?? []) as StaffOption[])
    }

    setIsLoading(false)
  }

  function openCreateDialog() {
    setEditingVisit(null)
    setForm(emptyForm)
    setError("")
    setDialogOpen(true)
  }

  function openEditDialog(visit: Visit) {
    setEditingVisit(visit)
    setForm({
      customerId: visit.customer_id,
      staffId: visit.staff_id ?? "",
      scheduledDate: visit.scheduled_date,
      scheduledTime: visit.scheduled_time.slice(0, 5),
    })
    setError("")
    setDialogOpen(true)
  }

  function handleCustomerChange(customerId: string) {
    const selectedCustomer = customers.find((customer) => customer.id === customerId)

    setForm({
      ...form,
      customerId,
      staffId: selectedCustomer?.assigned_staff_id ?? "",
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.customerId || !form.scheduledDate || !form.scheduledTime) {
      setError("Customer, date, and time are required.")
      return
    }

    if (scheduleConflict) {
      setError(
        `${scheduleConflict.staff_profiles?.full_name ?? "This staff member"} already has a visit at this date and time.`
      )
      return
    }

    setIsSaving(true)
    setError("")

    const payload = {
      customer_id: form.customerId,
      staff_id: form.staffId || null,
      scheduled_date: form.scheduledDate,
      scheduled_time: form.scheduledTime,
    }

    const supabase = createSupabaseBrowserClient()
    const { error: saveError } = editingVisit
      ? await supabase.from("visits").update(payload).eq("id", editingVisit.id)
      : await supabase.from("visits").insert({ ...payload, status: "Scheduled" })

    if (saveError) {
      setError(
        saveError.message.includes("visits_staff_schedule_slot_unique")
          ? "This staff member already has a visit at the selected date and time."
          : saveError.message
      )
    } else {
      setDialogOpen(false)
      await loadPageData()
    }

    setIsSaving(false)
  }

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Schedule Management" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-5 lg:p-6">
          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
            <SummaryCard title="Total Visits" value={visits.length.toString()} />
            <SummaryCard title="Today" value={todayVisitCount.toString()} />
            <SummaryCard title="Completed" value={statusCounts.completed.toString()} />
          </div>

          <Card className="mb-5 border-border bg-card py-4">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-3">
              <div>
                <CardTitle>Schedule Calendar</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Select a day to view its scheduled visits.</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Previous month"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="min-w-32 text-center text-sm font-medium">{formatMonth(calendarMonth)}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Next month"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {calendarWeekdays.map((weekday) => (
                  <div key={weekday} className="py-2">
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-14 rounded-md" />
                  }

                  const dateKey = formatDateKey(date)
                  const visitCount = visitCountByDate[dateKey] ?? 0
                  const isSelected = dateFilter === dateKey

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      className={`min-h-14 rounded-md border p-2 text-left transition-colors hover:border-primary hover:bg-primary/5 ${
                        isSelected ? "border-primary bg-primary/10" : "border-border"
                      }`}
                      onClick={() => setDateFilter(dateKey)}
                    >
                      <span className="text-sm font-medium">{date.getDate()}</span>
                      {visitCount > 0 && (
                        <span className="mt-2 block text-xs font-medium text-primary">
                          {visitCount} {visitCount === 1 ? "visit" : "visits"}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card py-4">
            <CardHeader className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Visit Monitoring</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track schedule status, staff completion remarks, and chemical usage.
                </p>
              </div>
              <Button onClick={openCreateDialog} className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Visit
              </Button>
            </CardHeader>
            <CardContent className="px-4">
              {error && (
                <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="mb-4 grid gap-3 rounded-lg border border-border bg-secondary/40 p-3 lg:grid-cols-[auto_1fr] lg:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  Filter visits
                </div>
                <div className="grid gap-2 sm:grid-cols-[auto_auto_auto_1fr]">
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    {statusFilters.map((filter) => (
                      <Button
                        key={filter}
                        type="button"
                        size="sm"
                        variant={statusFilter === filter ? "default" : "outline"}
                        onClick={() => setStatusFilter(filter)}
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                  <Select value={staffFilter} onValueChange={setStaffFilter}>
                    <SelectTrigger aria-label="Filter by staff" className="w-full sm:w-44">
                      <SelectValue placeholder="All staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All staff</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    aria-label="Filter by date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="sm:w-44"
                  />
                  {(staffFilter !== "all" || dateFilter) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStaffFilter("all")
                        setDateFilter("")
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading schedules...
                </div>
              ) : visits.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No visits scheduled yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add the first scheduled visit for a customer.</p>
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No {statusFilter.toLowerCase()} visits</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different status filter.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Chemical Used</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="max-w-72">
                            <p className="font-medium">{visit.customers?.business_name ?? "Unknown customer"}</p>
                            <p className="truncate text-xs text-muted-foreground">{visit.customers?.address ?? "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{visit.staff_profiles?.full_name ?? "Unassigned"}</TableCell>
                        <TableCell>{formatDate(visit.scheduled_date)}</TableCell>
                        <TableCell>{formatTime(visit.scheduled_time)}</TableCell>
                        <TableCell>
                          <StatusBadge status={visit.status} />
                        </TableCell>
                        <TableCell>{formatChemicalUsage(visit.visit_chemical_usages)}</TableCell>
                        <TableCell>
                          <p className="max-w-72 truncate text-sm text-muted-foreground">
                            {visit.remarks ?? "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {visit.status !== "Completed" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(visit)}
                                aria-label="Reschedule visit"
                                title="Reschedule visit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
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
            <DialogTitle>{editingVisit ? "Reschedule Visit" : "Add Scheduled Visit"}</DialogTitle>
            <DialogDescription>
              {editingVisit
                ? "Update the customer, staff assignment, date, or time for this visit."
                : "Create a visit and assign it to an active staff member."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <Field label="Customer" htmlFor="customer">
              <Select value={form.customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger id="customer" className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Staff" htmlFor="staff">
              <Select
                value={form.staffId}
                onValueChange={(staffId) => setForm({ ...form, staffId })}
              >
                <SelectTrigger id="staff" className="w-full">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" htmlFor="scheduledDate">
                <Input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })}
                />
              </Field>
              <Field label="Time" htmlFor="scheduledTime">
                <Input
                  id="scheduledTime"
                  type="time"
                  value={form.scheduledTime}
                  onChange={(event) => setForm({ ...form, scheduledTime: event.target.value })}
                />
              </Field>
            </div>

            {scheduleConflict && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {scheduleConflict.staff_profiles?.full_name ?? "This staff member"} already has a visit at this date
                and time. Choose another staff member or time slot.
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || Boolean(scheduleConflict)}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingVisit ? "Save Schedule" : "Add Visit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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

function StatusBadge({ status }: { status: Visit["status"] }) {
  const className =
    status === "Completed"
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : status === "In Progress"
        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
        : "bg-amber-100 text-amber-700 hover:bg-amber-100"

  return (
    <Badge variant="secondary" className={className}>
      {status}
    </Badge>
  )
}

function formatChemicalUsage(usages: Visit["visit_chemical_usages"]) {
  if (usages.length === 0) {
    return "-"
  }

  return usages
    .map((usage) => {
      const chemicalName = usage.chemicals?.name ?? "Unknown chemical"
      const unit = usage.chemicals?.unit ?? ""

      return `${chemicalName} (${formatQuantity(usage.quantity_used, unit)})`
    })
    .join(", ")
}

function formatQuantity(value: number, unit: string) {
  return `${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}${unit ? ` ${unit}` : ""}`
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatTime(time: string) {
  const [hours = "00", minutes = "00"] = time.split(":")
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}
