"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Users,
  LogOut,
  FlaskConical,
  X,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Tests", href: "/admin/tests", icon: FlaskConical },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
]

const secondaryNav = [
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

interface AdminSidebarProps {
  open?: boolean
  onClose?: () => void
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight leading-none">TestHub</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="mt-auto space-y-1">
            {secondaryNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/admin/login"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin</span>
              <span className="text-xs text-muted-foreground">Super Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
