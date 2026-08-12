"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { FlaskConical, Loader2, Pencil, Plus, Trash2 } from "lucide-react"

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
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface Chemical {
  id: string
  name: string
  unit: string
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
}

interface ChemicalFormState {
  name: string
  unit: string
  stockQuantity: string
  lowStockThreshold: string
}

const emptyForm: ChemicalFormState = {
  name: "",
  unit: "ml",
  stockQuantity: "0",
  lowStockThreshold: "0",
}

export default function AdminInventoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chemicals, setChemicals] = useState<Chemical[]>([])
  const [form, setForm] = useState<ChemicalFormState>(emptyForm)
  const [editingChemical, setEditingChemical] = useState<Chemical | null>(null)
  const [chemicalToRemove, setChemicalToRemove] = useState<Chemical | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const activeChemicals = useMemo(
    () => chemicals.filter((chemical) => chemical.is_active).length,
    [chemicals]
  )

  const lowStockChemicals = useMemo(
    () => chemicals.filter((chemical) => chemical.is_active && isLowStock(chemical)).length,
    [chemicals]
  )

  useEffect(() => {
    void loadChemicals()
  }, [])

  async function loadChemicals() {
    setIsLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()
    const { data, error: chemicalsError } = await supabase
      .from("chemicals")
      .select("id, name, unit, stock_quantity, low_stock_threshold, is_active")
      .order("name", { ascending: true })

    if (chemicalsError) {
      setError(`${chemicalsError.message}. Run the latest supabase/schema.sql in Supabase SQL Editor.`)
      setChemicals([])
    } else {
      setChemicals((data ?? []) as Chemical[])
    }

    setIsLoading(false)
  }

  function openCreateDialog() {
    setEditingChemical(null)
    setForm(emptyForm)
    setError("")
    setDialogOpen(true)
  }

  function openEditDialog(chemical: Chemical) {
    setEditingChemical(chemical)
    setForm({
      name: chemical.name,
      unit: chemical.unit,
      stockQuantity: String(chemical.stock_quantity),
      lowStockThreshold: String(chemical.low_stock_threshold),
    })
    setError("")
    setDialogOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const stockQuantity = Number(form.stockQuantity)
    const lowStockThreshold = Number(form.lowStockThreshold)

    if (!form.name.trim()) {
      setError("Chemical name is required.")
      return
    }

    if (Number.isNaN(stockQuantity) || stockQuantity < 0 || Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      setError("Stock quantity and low stock threshold must be valid non-negative numbers.")
      return
    }

    setIsSaving(true)
    setError("")

    const payload = {
      name: form.name.trim(),
      unit: form.unit,
      stock_quantity: stockQuantity,
      low_stock_threshold: lowStockThreshold,
    }

    const supabase = createSupabaseBrowserClient()
    const request = editingChemical
      ? supabase.from("chemicals").update(payload).eq("id", editingChemical.id)
      : supabase.from("chemicals").insert(payload)

    const { error: saveError } = await request

    if (saveError) {
      setError(saveError.message)
    } else {
      setDialogOpen(false)
      await loadChemicals()
    }

    setIsSaving(false)
  }

  async function toggleChemical(chemical: Chemical) {
    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase
      .from("chemicals")
      .update({ is_active: !chemical.is_active })
      .eq("id", chemical.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadChemicals()
  }

  async function removeChemical() {
    if (!chemicalToRemove) {
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { error: deleteError } = await supabase
      .from("chemicals")
      .delete()
      .eq("id", chemicalToRemove.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setChemicalToRemove(null)
    await loadChemicals()
  }

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Inventory Management" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-5 lg:p-6">
          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
            <SummaryCard title="Total Chemicals" value={chemicals.length.toString()} />
            <SummaryCard title="Active Chemicals" value={activeChemicals.toString()} />
            <SummaryCard title="Low Stock Alerts" value={lowStockChemicals.toString()} />
          </div>

          <Card className="border-border bg-card py-4">
            <CardHeader className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Chemical Inventory</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track stock quantity and low-stock thresholds before connecting usage to visits.
                </p>
              </div>
              <Button onClick={openCreateDialog} className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Chemical
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
                  Loading inventory...
                </div>
              ) : chemicals.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <FlaskConical className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No chemicals yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add chemicals and stock balance to begin tracking.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chemical</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Low Threshold</TableHead>
                      <TableHead>Stock Alert</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chemicals.map((chemical) => (
                      <TableRow key={chemical.id}>
                        <TableCell className="font-medium">{chemical.name}</TableCell>
                        <TableCell>{formatQuantity(chemical.stock_quantity, chemical.unit)}</TableCell>
                        <TableCell>{formatQuantity(chemical.low_stock_threshold, chemical.unit)}</TableCell>
                        <TableCell>
                          {isLowStock(chemical) ? (
                            <Badge variant="destructive">Low stock</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={chemical.is_active ? "default" : "secondary"}>
                            {chemical.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(chemical)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleChemical(chemical)}>
                              {chemical.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setChemicalToRemove(chemical)}>
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
            <DialogTitle>{editingChemical ? "Edit Chemical" : "Add Chemical"}</DialogTitle>
            <DialogDescription>
              Store stock balance now. Visit chemical usage will be connected in the next phase.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chemical name" htmlFor="name">
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Example: Gel bait"
                />
              </Field>
              <Field label="Unit" htmlFor="unit">
                <Select value={form.unit} onValueChange={(unit) => setForm({ ...form, unit })}>
                  <SelectTrigger id="unit" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="litre">litre</SelectItem>
                    <SelectItem value="gram">gram</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Stock quantity" htmlFor="stockQuantity">
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.stockQuantity}
                  onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                />
              </Field>
              <Field label="Low stock threshold" htmlFor="lowStockThreshold">
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.lowStockThreshold}
                  onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })}
                />
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingChemical ? "Save Changes" : "Add Chemical"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(chemicalToRemove)} onOpenChange={(open) => !open && setChemicalToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove chemical?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {chemicalToRemove?.name ?? "this chemical"} from inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeChemical}
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
            >
              Remove Chemical
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

function isLowStock(chemical: Chemical) {
  return chemical.stock_quantity <= chemical.low_stock_threshold
}

function formatQuantity(value: number, unit: string) {
  return `${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })} ${unit}`
}
