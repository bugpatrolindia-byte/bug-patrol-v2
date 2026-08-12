"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface SignOutButtonProps {
  className?: string
  iconClassName?: string
  onClick?: () => void
}

export function SignOutButton({ className, iconClassName, onClick }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
    } finally {
      onClick?.()
      window.location.assign("/login")
    }
  }

  return (
    <button
      type="button"
      disabled={isSigningOut}
      onClick={handleSignOut}
      className={className}
    >
      <LogOut className={iconClassName} />
      {isSigningOut ? "Logging out..." : "Log out"}
    </button>
  )
}
