import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create staff accounts." }, { status: 403 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Staff account creation is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment." },
        { status: 500 }
      )
    }

    const body = (await request.json()) as {
      fullName?: unknown
      email?: unknown
      password?: unknown
      phone?: unknown
      jobTitle?: unknown
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() || null : null
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() || null : null

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "The staff password must be at least 8 characters." }, { status: 400 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "staff" },
      user_metadata: { full_name: fullName },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? "Unable to create the staff login." }, { status: 400 })
    }

    const { data: profile, error: profileError } = await adminClient
      .from("staff_profiles")
      .insert({
        auth_user_id: authData.user.id,
        full_name: fullName,
        email,
        phone,
        job_title: jobTitle,
        is_active: true,
      })
      .select("id, full_name, email, phone, job_title, is_active")
      .single()

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the staff account."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
