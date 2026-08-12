import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getUserRole } from "@/lib/auth/roles"

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ""

  return NextResponse.redirect(url)
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("next", request.nextUrl.pathname)

  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isLoginRoute = pathname === "/login"
  const isStaffRoute = pathname === "/" || pathname === "/history" || pathname === "/profile"
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")

  if (!isLoginRoute && !isStaffRoute && !isAdminRoute) {
    return NextResponse.next()
  }

  if (!isSupabaseConfigured()) {
    return isLoginRoute ? NextResponse.next() : redirectToLogin(request)
  }

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = getUserRole(user)

  if (isLoginRoute && user) {
    return redirectTo(request, role === "admin" ? "/admin" : "/")
  }

  if ((isStaffRoute || isAdminRoute) && !user) {
    return redirectToLogin(request)
  }

  if (isAdminRoute && role !== "admin") {
    return redirectTo(request, role === "staff" ? "/" : "/login")
  }

  if (isStaffRoute && role !== "staff") {
    return redirectTo(request, role === "admin" ? "/admin" : "/login")
  }

  return response
}

export const config = {
  matcher: ["/", "/history", "/profile", "/login", "/admin/:path*"],
}
