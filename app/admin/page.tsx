"use client"

import { useState } from "react"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Target, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Users",
    value: "2,847",
    change: "+12.5%",
    icon: Users,
  },
  {
    title: "Tests Taken",
    value: "14,392",
    change: "+8.2%",
    icon: FileText,
  },
  {
    title: "Average Score",
    value: "76.4%",
    change: "+3.1%",
    icon: Target,
  },
  {
    title: "Completion Rate",
    value: "89.2%",
    change: "+5.7%",
    icon: TrendingUp,
  },
]

const recentAttempts = [
  { user: "Sarah Johnson", test: "Cognitive Assessment", score: 85, date: "2 hours ago" },
  { user: "Mike Chen", test: "Personality Test", score: 72, date: "3 hours ago" },
  { user: "Emily Davis", test: "Leadership Skills", score: 91, date: "5 hours ago" },
  { user: "James Wilson", test: "Cognitive Assessment", score: 68, date: "6 hours ago" },
  { user: "Lisa Anderson", test: "Technical Aptitude", score: 88, date: "8 hours ago" },
]

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Dashboard" onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-3 sm:p-6 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold sm:text-2xl">{stat.value}</div>
                  <p className="text-xs text-emerald-600 mt-1">{stat.change} from last month</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Attempts */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Recent Attempts</h2>
            <Card className="overflow-hidden border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Test</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentAttempts.map((attempt, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{attempt.user}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{attempt.test}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={attempt.score >= 80 ? "text-emerald-600" : attempt.score >= 60 ? "text-amber-600" : "text-red-500"}>
                            {attempt.score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{attempt.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </>
  )
}
