"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarCheck2, Download, FlaskConical, Loader2, Users } from "lucide-react"

import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface ReportVisit {
  id: string
  scheduled_date: string
  status: "Scheduled" | "In Progress" | "Completed"
  remarks: string | null
  staff_profiles: {
    full_name: string
  } | null
  customers: {
    business_name: string
  } | null
  visit_chemical_usages: {
    quantity_used: number
    chemicals: {
      name: string
      unit: string
    } | null
  }[]
}

interface ReportStaff {
  id: string
  full_name: string
}

interface ChemicalReportRow {
  name: string
  unit: string
  totalQuantity: number
  entryCount: number
}

interface StaffReportRow {
  name: string
  completed: number
  inProgress: number
  scheduled: number
}

export default function AdminReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [visits, setVisits] = useState<ReportVisit[]>([])
  const [staffOptions, setStaffOptions] = useState<ReportStaff[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()))
  const [selectedStaff, setSelectedStaff] = useState("all")
  const [selectedCustomer, setSelectedCustomer] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void loadReports()
  }, [])

  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonth) {
      return "All dates"
    }

    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${selectedMonth}-01T00:00:00`))
  }, [selectedMonth])

  const staffNames = useMemo(() => {
    return staffOptions.map((staff) => staff.full_name)
  }, [staffOptions])

  const customerNames = useMemo(() => {
    return Array.from(new Set(visits.map((visit) => visit.customers?.business_name ?? "Unknown customer"))).sort()
  }, [visits])

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const matchesMonth = !selectedMonth || visit.scheduled_date.startsWith(selectedMonth)
      const matchesStaff =
        selectedStaff === "all" || (visit.staff_profiles?.full_name ?? "Unassigned") === selectedStaff
      const matchesCustomer =
        selectedCustomer === "all" || (visit.customers?.business_name ?? "Unknown customer") === selectedCustomer

      return matchesMonth && matchesStaff && matchesCustomer
    })
  }, [selectedCustomer, selectedMonth, selectedStaff, visits])

  const monthlyCompletedVisits = useMemo(() => {
    return filteredVisits.filter((visit) => visit.status === "Completed")
  }, [filteredVisits])

  const selectedPeriodLabel = useMemo(() => {
    if (!selectedMonth) {
      return "all selected dates"
    }

    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${selectedMonth}-01T00:00:00`))
  }, [selectedMonth])

  const chemicalRows = useMemo(() => {
    const totals = new Map<string, ChemicalReportRow>()

    monthlyCompletedVisits.forEach((visit) => {
      visit.visit_chemical_usages.forEach((usage) => {
        const name = usage.chemicals?.name ?? "Unknown chemical"
        const unit = usage.chemicals?.unit ?? ""
        const key = `${name}-${unit}`
        const current = totals.get(key) ?? {
          name,
          unit,
          totalQuantity: 0,
          entryCount: 0,
        }

        current.totalQuantity += Number(usage.quantity_used)
        current.entryCount += 1
        totals.set(key, current)
      })
    })

    return Array.from(totals.values()).sort((first, second) => second.totalQuantity - first.totalQuantity)
  }, [monthlyCompletedVisits])

  const staffRows = useMemo(() => {
    const totals = new Map<string, StaffReportRow>()

    filteredVisits.forEach((visit) => {
      const name = visit.staff_profiles?.full_name ?? "Unassigned"
      const current = totals.get(name) ?? {
        name,
        completed: 0,
        inProgress: 0,
        scheduled: 0,
      }

      if (visit.status === "Completed") {
        current.completed += 1
      } else if (visit.status === "In Progress") {
        current.inProgress += 1
      } else {
        current.scheduled += 1
      }

      totals.set(name, current)
    })

    return Array.from(totals.values()).sort((first, second) => second.completed - first.completed)
  }, [filteredVisits])

  function downloadCsv() {
    const headers = ["Date", "Customer", "Staff", "Status", "Chemicals", "Remarks"]
    const rows = filteredVisits.map((visit) => [
      visit.scheduled_date,
      visit.customers?.business_name ?? "Unknown customer",
      visit.staff_profiles?.full_name ?? "Unassigned",
      visit.status,
      formatChemicalUsage(visit.visit_chemical_usages),
      visit.remarks ?? "",
    ])
    const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `bug-patrol-report-${selectedMonth || "all-dates"}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function loadReports() {
    setIsLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const [visitsResult, staffResult] = await Promise.all([
      supabase
        .from("visits")
        .select(
          "id, scheduled_date, status, remarks, staff_profiles(full_name), customers(business_name), visit_chemical_usages(quantity_used, chemicals(name, unit))"
        )
        .order("scheduled_date", { ascending: false }),
      supabase.from("staff_profiles").select("id, full_name").order("full_name", { ascending: true }),
    ])

    if (visitsResult.error) {
      setError(`${visitsResult.error.message}. Run the latest supabase/schema.sql in Supabase SQL Editor.`)
      setVisits([])
    } else {
      setVisits((visitsResult.data ?? []) as ReportVisit[])
    }

    if (staffResult.error) {
      setError(staffResult.error.message)
      setStaffOptions([])
    } else {
      setStaffOptions((staffResult.data ?? []) as ReportStaff[])
    }

    setIsLoading(false)
  }

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Reports" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-5 lg:p-6">
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Card className="mb-5 border-border bg-card py-4">
            <CardContent className="flex flex-col gap-3 px-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <div className="grid gap-2">
                  <label htmlFor="reportMonth" className="text-sm font-medium">Month</label>
                  <Input id="reportMonth" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Staff</label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger><SelectValue placeholder="All staff" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All staff</SelectItem>
                      {staffNames.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Customer</label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger><SelectValue placeholder="All customers" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All customers</SelectItem>
                      {customerNames.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="button" variant="outline" className="gap-2" onClick={downloadCsv} disabled={filteredVisits.length === 0}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardContent>
          </Card>

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
            <SummaryCard title={`${selectedMonthLabel} Completed`} value={monthlyCompletedVisits.length.toString()} icon={CalendarCheck2} />
            <SummaryCard title="Filtered Visits" value={filteredVisits.length.toString()} icon={BarChart3} />
            <SummaryCard title="Chemical Entries" value={chemicalRows.reduce((total, row) => total + row.entryCount, 0).toString()} icon={FlaskConical} />
            <SummaryCard title="Staff With Visits" value={staffRows.length.toString()} icon={Users} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ReportCard
              title="Chemical Consumption"
              description={`Usage from completed visits in ${selectedPeriodLabel}.`}
              isLoading={isLoading}
              isEmpty={chemicalRows.length === 0}
              emptyText="No chemical usage found for this month."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chemical</TableHead>
                    <TableHead>Entries</TableHead>
                    <TableHead className="text-right">Total Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chemicalRows.map((row) => (
                    <TableRow key={`${row.name}-${row.unit}`}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.entryCount}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.totalQuantity, row.unit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ReportCard>

            <ReportCard
              title="Staff Work Summary"
              description="Visit status totals grouped by staff member."
              isLoading={isLoading}
              isEmpty={staffRows.length === 0}
              emptyText="No staff visit data found yet."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>In Progress</TableHead>
                    <TableHead>Scheduled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.completed}</TableCell>
                      <TableCell>{row.inProgress}</TableCell>
                      <TableCell>{row.scheduled}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ReportCard>
          </div>
        </main>
      </div>
    </>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-border bg-card py-3 shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 text-2xl font-semibold leading-none">{value}</div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function ReportCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyText,
  children,
}: {
  title: string
  description: string
  isLoading: boolean
  isEmpty: boolean
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-border bg-card py-4 shadow-sm">
      <CardHeader className="px-4 pb-3">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading report...
          </div>
        ) : isEmpty ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

function formatQuantity(value: number, unit: string) {
  return `${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}${unit ? ` ${unit}` : ""}`
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function formatChemicalUsage(usages: ReportVisit["visit_chemical_usages"]) {
  if (usages.length === 0) {
    return "-"
  }

  return usages
    .map((usage) => {
      const name = usage.chemicals?.name ?? "Unknown chemical"
      const unit = usage.chemicals?.unit ?? ""

      return `${name} (${formatQuantity(Number(usage.quantity_used), unit)})`
    })
    .join("; ")
}

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
