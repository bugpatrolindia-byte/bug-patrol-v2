"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarCheck2, FlaskConical, Loader2, MapPin, MessageSquareText } from "lucide-react"

import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface CompletedVisit {
  id: string
  scheduled_date: string
  scheduled_time: string
  remarks: string | null
  customers: {
    business_name: string
    address: string
  } | null
  visit_chemical_usages: {
    quantity_used: number
    chemicals: {
      name: string
      unit: string
    } | null
  }[]
}

export default function StaffHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [visits, setVisits] = useState<CompletedVisit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void loadVisitHistory()
  }, [])

  const totalChemicalsUsed = useMemo(() => {
    return visits.reduce((total, visit) => total + visit.visit_chemical_usages.length, 0)
  }, [visits])

  async function loadVisitHistory() {
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

    const { data: profile, error: profileError } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (profileError) {
      setError(profileError.message)
      setIsLoading(false)
      return
    }

    if (!profile) {
      setError("No active staff profile is linked to this login user.")
      setVisits([])
      setIsLoading(false)
      return
    }

    const { data, error: visitsError } = await supabase
      .from("visits")
      .select(
        "id, scheduled_date, scheduled_time, remarks, customers(business_name, address), visit_chemical_usages(quantity_used, chemicals(name, unit))"
      )
      .eq("staff_id", profile.id)
      .eq("status", "Completed")
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false })

    if (visitsError) {
      setError(`${visitsError.message}. Run the latest supabase/schema.sql in Supabase SQL Editor.`)
      setVisits([])
    } else {
      setVisits((data ?? []) as CompletedVisit[])
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64">
        <Navbar
          title="Visit History"
          subtitle="Completed jobs, remarks, and chemical usage"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-3 sm:p-5 lg:p-6">
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
            <SummaryCard title="Completed Visits" value={visits.length.toString()} />
            <SummaryCard title="Chemical Entries" value={totalChemicalsUsed.toString()} />
          </div>

          <Card className="border-border bg-card py-4">
            <CardHeader className="flex flex-col gap-1 px-4 pb-3">
              <CardTitle>Completed Visit History</CardTitle>
              <p className="text-sm text-muted-foreground">Review submitted completion details for your past visits.</p>
            </CardHeader>
            <CardContent className="px-4">
              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading visit history...
                </div>
              ) : visits.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <CalendarCheck2 className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No completed visits yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Completed jobs will appear here after submission.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Chemical Used</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="max-w-72">
                            <p className="font-medium">{visit.customers?.business_name ?? "Unknown customer"}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {visit.customers?.address ?? "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(visit.scheduled_date)}</TableCell>
                        <TableCell>{formatTime(visit.scheduled_time)}</TableCell>
                        <TableCell>
                          <div className="flex max-w-80 flex-wrap gap-1">
                            {visit.visit_chemical_usages.length === 0 ? (
                              <span className="text-sm text-muted-foreground">-</span>
                            ) : (
                              visit.visit_chemical_usages.map((usage, index) => (
                                <Badge key={`${visit.id}-${index}`} variant="secondary" className="gap-1">
                                  <FlaskConical className="h-3 w-3" />
                                  {usage.chemicals?.name ?? "Unknown"} · {formatQuantity(usage.quantity_used, usage.chemicals?.unit ?? "")}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="flex max-w-80 items-center gap-2 truncate text-sm text-muted-foreground">
                            <MessageSquareText className="h-4 w-4 shrink-0" />
                            {visit.remarks ?? "-"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
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

function formatQuantity(value: number, unit: string) {
  return `${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}${unit ? ` ${unit}` : ""}`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
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
