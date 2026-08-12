import type { User } from "@supabase/supabase-js"

export type UserRole = "staff" | "admin"

export function getUserRole(user: User | null | undefined): UserRole | null {
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role

  return role === "staff" || role === "admin" ? role : null
}
