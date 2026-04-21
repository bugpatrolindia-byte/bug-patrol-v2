"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminNavbarProps {
  title: string
  onMenuClick?: () => void
}

export function AdminNavbar({ title, onMenuClick }: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-3 backdrop-blur-sm sm:h-16 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold tracking-tight sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-lg transition-all duration-200 hover:bg-accent">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  )
}
