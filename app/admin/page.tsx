"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CalendarClock, CheckCircle2, Coffee, Hotel, Loader2, Store, Timer, XCircle } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"

type CustomerType = "Hotel" | "Cafe" | "Other"
type VisitStatus = "Scheduled" | "In Progress" | "Completed"

interface CustomerSummary {
  customer_type: CustomerType
  is_active: boolean
}

interface VisitSummary {
  scheduled_date: string
  status: VisitStatus
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [visits, setVisits] = useState<VisitSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      setError("")

      const supabase = createSupabaseBrowserClient()
      const [customersResult, visitsResult] = await Promise.all([
        supabase
          .from("customers")
          .select("customer_type, is_active"),
        supabase
          .from("visits")
          .select("scheduled_date, status"),
      ])

      if (customersResult.error) {
        setError(`${customersResult.error.message}. Check that supabase/schema.sql has been run.`)
        setCustomers([])
      } else {
        setCustomers((customersResult.data ?? []) as CustomerSummary[])
      }

      if (visitsResult.error) {
        setError(`${visitsResult.error.message}. Check that supabase/schema.sql has been run.`)
        setVisits([])
      } else {
        setVisits((visitsResult.data ?? []) as VisitSummary[])
      }

      setIsLoading(false)
    }

    void loadDashboard()
  }, [])

  const customerStats = useMemo(() => {
    const hotels = customers.filter((customer) => customer.customer_type === "Hotel").length
    const cafes = customers.filter((customer) => customer.customer_type === "Cafe").length
    const others = customers.filter((customer) => customer.customer_type === "Other").length
    const active = customers.filter((customer) => customer.is_active).length
    const inactive = customers.length - active

    return [
      {
        title: "Total Customers",
        value: customers.length.toString(),
        icon: Building2,
        accent: "border-teal-200 bg-teal-50/70 text-teal-700",
        iconAccent: "bg-teal-100 text-teal-700",
      },
      {
        title: "Hotels",
        value: hotels.toString(),
        icon: Hotel,
        accent: "border-sky-200 bg-sky-50/70 text-sky-700",
        iconAccent: "bg-sky-100 text-sky-700",
      },
      {
        title: "Cafes",
        value: cafes.toString(),
        icon: Coffee,
        accent: "border-amber-200 bg-amber-50/70 text-amber-700",
        iconAccent: "bg-amber-100 text-amber-700",
      },
      {
        title: "Others",
        value: others.toString(),
        icon: Store,
        accent: "border-violet-200 bg-violet-50/70 text-violet-700",
        iconAccent: "bg-violet-100 text-violet-700",
      },
      {
        title: "Active",
        value: active.toString(),
        icon: CheckCircle2,
        accent: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
        iconAccent: "bg-emerald-100 text-emerald-700",
      },
      {
        title: "Inactive",
        value: inactive.toString(),
        icon: XCircle,
        accent: "border-rose-200 bg-rose-50/70 text-rose-700",
        iconAccent: "bg-rose-100 text-rose-700",
      },
    ]
  }, [customers])

  const visitStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayVisits = visits.filter((visit) => visit.scheduled_date === today).length
    const pendingVisits = visits.filter((visit) => visit.status === "Scheduled").length
    const inProgressVisits = visits.filter((visit) => visit.status === "In Progress").length
    const completedVisits = visits.filter((visit) => visit.status === "Completed").length

    return [
      {
        title: "Today's Visits",
        value: todayVisits.toString(),
        icon: CalendarClock,
        accent: "border-cyan-200 bg-cyan-50/70 text-cyan-700",
        iconAccent: "bg-cyan-100 text-cyan-700",
      },
      {
        title: "Pending Visits",
        value: pendingVisits.toString(),
        icon: Timer,
        accent: "border-orange-200 bg-orange-50/70 text-orange-700",
        iconAccent: "bg-orange-100 text-orange-700",
      },
      {
        title: "Completed Visits",
        value: completedVisits.toString(),
        icon: CheckCircle2,
        accent: "border-lime-200 bg-lime-50/70 text-lime-700",
        iconAccent: "bg-lime-100 text-lime-700",
      },
      {
        title: "In Progress",
        value: inProgressVisits.toString(),
        icon: Loader2,
        accent: "border-indigo-200 bg-indigo-50/70 text-indigo-700",
        iconAccent: "bg-indigo-100 text-indigo-700",
      },
    ]
  }, [visits])

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Admin Dashboard" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-5 lg:p-6">
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DashboardSection title="Visit Overview" stats={visitStats} isLoading={isLoading} columns="lg:grid-cols-4" />

          <DashboardSection
            title="Customer Overview"
            stats={customerStats}
            isLoading={isLoading}
            className="mt-5"
          />

          <Card className="mt-5 border-teal-200 bg-gradient-to-r from-teal-50 to-white py-4 shadow-sm">
            <CardHeader className="px-4 pb-1">
              <CardTitle className="text-base text-teal-950">Control Panel</CardTitle>
            </CardHeader>
            <CardContent className="px-4 text-sm text-teal-900/75">
              Customer totals and visit summaries are connected to Supabase. Add schedules from the Schedules page.
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  )
}

function DashboardSection({
  title,
  stats,
  isLoading,
  className,
  columns = "lg:grid-cols-3",
}: {
  title: string
  stats: Array<{
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    accent: string
    iconAccent: string
  }>
  isLoading: boolean
  className?: string
  columns?: string
}) {
  return (
    <section className={className}>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3", columns)}>
        {stats.map((stat) => (
          <Card key={stat.title} className={cn("overflow-hidden border py-3 shadow-sm", stat.accent)}>
            <CardContent className="flex items-center justify-between gap-3 px-4">
              <div className="min-w-0">
                <CardTitle className="truncate text-sm font-medium text-foreground/75">{stat.title}</CardTitle>
                <div className="mt-2 flex min-h-7 items-center text-2xl font-semibold leading-none text-foreground">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-current" /> : stat.value}
                </div>
              </div>
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", stat.iconAccent)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
