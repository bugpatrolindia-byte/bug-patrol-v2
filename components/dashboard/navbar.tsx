"use client"

import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 lg:px-8 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">My Assessments</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">A calmer way to understand yourself</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assessments..."
            className="h-10 w-48 rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary md:w-72"
          />
        </div>

        {/* Mobile search */}
        <Button variant="ghost" size="icon" className="sm:hidden h-10 w-10">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-lg transition-all duration-200 hover:bg-accent">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  )
}
