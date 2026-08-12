"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, Clock, Loader2, MapPin } from "lucide-react"

import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
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

interface AssignedVisit {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: "Scheduled" | "In Progress" | "Completed"
  customers: {
    business_name: string
    address: string
    location_url: string | null
  } | null
}

interface ChemicalOption {
  id: string
  name: string
  unit: string
  stock_quantity: number
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [visits, setVisits] = useState<AssignedVisit[]>([])
  const [chemicals, setChemicals] = useState<ChemicalOption[]>([])
  const [visitToComplete, setVisitToComplete] = useState<AssignedVisit | null>(null)
  const [selectedChemicalId, setSelectedChemicalId] = useState("")
  const [quantityUsed, setQuantityUsed] = useState("")
  const [completionRemarks, setCompletionRemarks] = useState("")
  const [completionError, setCompletionError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")

  async function loadAssignedVisits() {
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

    const [visitsResult, chemicalsResult] = await Promise.all([
      supabase
        .from("visits")
        .select("id, scheduled_date, scheduled_time, status, customers(business_name, address, location_url)")
        .eq("staff_id", profile.id)
        .neq("status", "Completed")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true }),
      supabase
        .from("chemicals")
        .select("id, name, unit, stock_quantity")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ])

    if (visitsResult.error) {
      setError(visitsResult.error.message)
      setVisits([])
    } else {
      setVisits((visitsResult.data ?? []) as AssignedVisit[])
    }

    if (chemicalsResult.error) {
      setError(chemicalsResult.error.message)
      setChemicals([])
    } else {
      setChemicals((chemicalsResult.data ?? []) as ChemicalOption[])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    void loadAssignedVisits()
  }, [])

  async function startVisit(visit: AssignedVisit) {
    setIsUpdating(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase
      .from("visits")
      .update({ status: "In Progress" })
      .eq("id", visit.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      await loadAssignedVisits()
    }

    setIsUpdating(false)
  }

  function openCompleteDialog(visit: AssignedVisit) {
    setVisitToComplete(visit)
    setSelectedChemicalId("")
    setQuantityUsed("")
    setCompletionRemarks("")
    setCompletionError("")
    setError("")
  }

  async function completeVisit() {
    if (!visitToComplete) {
      return
    }

    const parsedQuantityUsed = Number(quantityUsed)

    if (!selectedChemicalId) {
      setCompletionError("Select the chemical used before completing the visit.")
      return
    }

    if (Number.isNaN(parsedQuantityUsed) || parsedQuantityUsed <= 0) {
      setCompletionError("Enter a valid quantity used before completing the visit.")
      return
    }

    setIsUpdating(true)
    setCompletionError("")

    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase.rpc("complete_assigned_visit", {
      visit_id_to_complete: visitToComplete.id,
      chemical_id_used: selectedChemicalId,
      quantity_used_value: parsedQuantityUsed,
      completion_remarks: completionRemarks,
    })

    if (updateError) {
      setCompletionError(updateError.message)
    } else {
      setVisitToComplete(null)
      setSelectedChemicalId("")
      setQuantityUsed("")
      setCompletionRemarks("")
      setCompletionError("")
      await loadAssignedVisits()
    }

    setIsUpdating(false)
  }

  const todayVisits = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)

    return visits.filter((visit) => visit.scheduled_date === today)
  }, [visits])

  const upcomingVisits = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)

    return visits.filter((visit) => visit.scheduled_date > today)
  }, [visits])

  const selectedChemical = useMemo(
    () => chemicals.find((chemical) => chemical.id === selectedChemicalId),
    [chemicals, selectedChemicalId]
  )

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-3 sm:p-5 lg:p-6">
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
            <SummaryCard title="Today's Visits" value={todayVisits.length.toString()} />
            <SummaryCard title="Upcoming" value={upcomingVisits.length.toString()} />
            <SummaryCard title="Assigned Open" value={visits.length.toString()} />
          </div>

          <Card className="border-border bg-card py-4">
            <CardHeader className="flex flex-col gap-1 px-4 pb-3">
              <CardTitle>Assigned Visits</CardTitle>
              <p className="text-sm text-muted-foreground">Today and upcoming visits assigned to your staff profile.</p>
            </CardHeader>
            <CardContent className="px-4">
              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading assigned visits...
                </div>
              ) : visits.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No assigned visits</p>
                  <p className="mt-1 text-sm text-muted-foreground">Assigned scheduled visits will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">{visit.customers?.business_name ?? "Unknown customer"}</TableCell>
                        <TableCell>
                          <div className="flex max-w-80 items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{visit.customers?.address ?? "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(visit.scheduled_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatTime(visit.scheduled_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{visit.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {visit.status === "Scheduled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdating}
                                onClick={() => startVisit(visit)}
                              >
                                Start
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => openCompleteDialog(visit)}
                            >
                              Complete
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
        </div>
      </main>

      <Dialog
        open={Boolean(visitToComplete)}
        onOpenChange={(open) => {
          if (!open) {
            setVisitToComplete(null)
            setCompletionError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete visit</DialogTitle>
            <DialogDescription>
              Add chemical usage and completion remarks for {visitToComplete?.customers?.business_name ?? "this visit"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {completionError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {completionError}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chemical used" htmlFor="chemicalUsed">
                <Select value={selectedChemicalId} onValueChange={setSelectedChemicalId}>
                  <SelectTrigger id="chemicalUsed" className="w-full">
                    <SelectValue placeholder="Select chemical" />
                  </SelectTrigger>
                  <SelectContent>
                    {chemicals.map((chemical) => (
                      <SelectItem key={chemical.id} value={chemical.id}>
                        {chemical.name} ({formatQuantity(chemical.stock_quantity, chemical.unit)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Quantity used${selectedChemical ? ` (${selectedChemical.unit})` : ""}`} htmlFor="quantityUsed">
                <Input
                  id="quantityUsed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantityUsed}
                  onChange={(event) => setQuantityUsed(event.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>
            {selectedChemical && (
              <p className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
                Available stock: {formatQuantity(selectedChemical.stock_quantity, selectedChemical.unit)}
              </p>
            )}
            {chemicals.length === 0 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                No active chemicals found. Ask admin to add inventory before completing visits.
              </p>
            )}
            <Textarea
              value={completionRemarks}
              onChange={(event) => setCompletionRemarks(event.target.value)}
              placeholder="Work completed, observations, or follow-up notes"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setVisitToComplete(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={isUpdating || chemicals.length === 0} onClick={completeVisit}>
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
              Mark Completed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
  })} ${unit}`
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
