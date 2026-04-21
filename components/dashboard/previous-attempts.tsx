"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Attempt {
  id: string
  testName: string
  category: string
  date: string
  score: number
  status: "passed" | "failed" | "pending"
  duration: string
}

const attempts: Attempt[] = [
  {
    id: "1",
    testName: "Work Style Portrait",
    category: "Personality",
    date: "Apr 18, 2026",
    score: 92,
    status: "passed",
    duration: "24 min",
  },
  {
    id: "2",
    testName: "Decision Patterns",
    category: "Cognitive",
    date: "Apr 15, 2026",
    score: 78,
    status: "passed",
    duration: "32 min",
  },
  {
    id: "3",
    testName: "Stress Response Check",
    category: "Wellbeing",
    date: "Apr 12, 2026",
    score: 45,
    status: "failed",
    duration: "41 min",
  },
  {
    id: "4",
    testName: "Collaboration Compass",
    category: "Social",
    date: "Apr 10, 2026",
    score: 88,
    status: "passed",
    duration: "28 min",
  },
  {
    id: "5",
    testName: "Leadership Signals",
    category: "Leadership",
    date: "Apr 8, 2026",
    score: 0,
    status: "pending",
    duration: "-",
  },
]

export function PreviousAttempts() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 sm:px-6 py-4 sm:py-5">
        <h2 className="text-lg font-semibold tracking-tight">Recent reflections</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your latest assessments and insight status</p>
      </div>
      
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-4">Test Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attempts.map((attempt) => (
              <tr
                key={attempt.id}
                className="transition-colors duration-200 hover:bg-accent/30"
              >
                <td className="px-6 py-4 font-medium">{attempt.testName}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{attempt.category}</span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {attempt.date}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      attempt.status === "passed" && "text-emerald-600",
                      attempt.status === "failed" && "text-red-500",
                      attempt.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {attempt.status === "pending" ? "-" : `${attempt.score}%`}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {attempt.duration}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "capitalize font-medium",
                      attempt.status === "passed" && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50",
                      attempt.status === "failed" && "bg-red-50 text-red-600 hover:bg-red-50",
                      attempt.status === "pending" && "bg-muted text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {attempt.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{attempt.testName}</p>
                <p className="text-sm text-muted-foreground">{attempt.category}</p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "capitalize font-medium shrink-0",
                  attempt.status === "passed" && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50",
                  attempt.status === "failed" && "bg-red-50 text-red-600 hover:bg-red-50",
                  attempt.status === "pending" && "bg-muted text-muted-foreground hover:bg-muted"
                )}
              >
                {attempt.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{attempt.date}</span>
              <span className="text-border">/</span>
              <span>{attempt.duration}</span>
              <span className="text-border">/</span>
              <span
                className={cn(
                  "font-semibold",
                  attempt.status === "passed" && "text-emerald-600",
                  attempt.status === "failed" && "text-red-500",
                  attempt.status === "pending" && "text-muted-foreground"
                )}
              >
                {attempt.status === "pending" ? "-" : `${attempt.score}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
