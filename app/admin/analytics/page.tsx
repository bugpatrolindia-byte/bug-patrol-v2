"use client"

import { useState } from "react"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Target, TrendingUp, Clock, Award } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

const stats = [
  { title: "Total Users", value: "2,847", change: "+12.5%", icon: Users },
  { title: "Tests Taken", value: "14,392", change: "+8.2%", icon: FileText },
  { title: "Average Score", value: "76.4%", change: "+3.1%", icon: Target },
  { title: "Completion Rate", value: "89.2%", change: "+5.7%", icon: TrendingUp },
  { title: "Avg. Time", value: "24 min", change: "-2.3%", icon: Clock },
  { title: "Pass Rate", value: "72.8%", change: "+4.2%", icon: Award },
]

const monthlyData = [
  { name: "Jan", tests: 1200, users: 180 },
  { name: "Feb", tests: 1400, users: 220 },
  { name: "Mar", tests: 1100, users: 190 },
  { name: "Apr", tests: 1600, users: 280 },
  { name: "May", tests: 1800, users: 320 },
  { name: "Jun", tests: 2100, users: 380 },
]

const scoreDistribution = [
  { range: "0-20", count: 120 },
  { range: "21-40", count: 340 },
  { range: "41-60", count: 890 },
  { range: "61-80", count: 1420 },
  { range: "81-100", count: 780 },
]

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Analytics" onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-3 sm:p-6 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold sm:text-xl">{stat.value}</div>
                  <p className={`text-xs mt-1 ${stat.change.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Tests Over Time */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Tests Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 min-w-[520px] sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tests"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 min-w-[520px] sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Users Chart */}
          <Card className="border-border bg-card mt-6">
            <CardHeader>
              <CardTitle className="text-lg">New Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 min-w-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="users" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  )
}
