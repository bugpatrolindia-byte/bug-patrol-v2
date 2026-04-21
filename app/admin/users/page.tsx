"use client"

import { useState } from "react"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, Mail, Eye } from "lucide-react"

const users = [
  { id: 1, name: "Sarah Johnson", email: "sarah.johnson@email.com", tests: 12, status: "active", joined: "Jan 15, 2024" },
  { id: 2, name: "Mike Chen", email: "mike.chen@email.com", tests: 8, status: "active", joined: "Feb 3, 2024" },
  { id: 3, name: "Emily Davis", email: "emily.davis@email.com", tests: 15, status: "active", joined: "Dec 20, 2023" },
  { id: 4, name: "James Wilson", email: "james.wilson@email.com", tests: 4, status: "inactive", joined: "Mar 8, 2024" },
  { id: 5, name: "Lisa Anderson", email: "lisa.anderson@email.com", tests: 22, status: "active", joined: "Nov 5, 2023" },
  { id: 6, name: "David Brown", email: "david.brown@email.com", tests: 6, status: "active", joined: "Feb 28, 2024" },
  { id: 7, name: "Anna Martinez", email: "anna.martinez@email.com", tests: 9, status: "inactive", joined: "Jan 22, 2024" },
  { id: 8, name: "Robert Taylor", email: "robert.taylor@email.com", tests: 18, status: "active", joined: "Oct 15, 2023" },
]

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Users" onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-3 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:w-72"
              />
            </div>
            <Button className="w-full sm:w-auto">Add User</Button>
          </div>

          {/* Desktop Table */}
          <Card className="hidden overflow-hidden border-border bg-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tests Taken</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {user.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{user.tests}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            user.status === "active"
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                              : "bg-muted text-muted-foreground hover:bg-muted"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.joined}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{user.name}</p>
                      <p className="break-all text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      user.status === "active"
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{user.tests} tests taken</span>
                  <span className="text-muted-foreground">Joined {user.joined}</span>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </>
  )
}
