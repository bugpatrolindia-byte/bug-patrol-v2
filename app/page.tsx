"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Navbar } from "@/components/dashboard/navbar"
import { TestCard } from "@/components/dashboard/test-card"
import { PreviousAttempts } from "@/components/dashboard/previous-attempts"

const availableTests = [
  {
    title: "Work Style Portrait",
    description: "Map how you plan, communicate, recharge, and respond when priorities shift.",
    duration: "18 min",
    questions: 24,
    category: "Personality",
    tone: "Self awareness",
  },
  {
    title: "Decision Patterns",
    description: "Explore how you weigh evidence, intuition, uncertainty, and feedback.",
    duration: "14 min",
    questions: 20,
    category: "Cognitive",
    tone: "Clarity",
  },
  {
    title: "Collaboration Compass",
    description: "Understand your natural role in teams and what helps you contribute well.",
    duration: "16 min",
    questions: 22,
    category: "Social",
    tone: "Team fit",
  },
  {
    title: "Stress Response Check",
    description: "Notice your patterns under pressure and the support that keeps you steady.",
    duration: "12 min",
    questions: 18,
    category: "Wellbeing",
    tone: "Balance",
  },
  {
    title: "Leadership Signals",
    description: "See how you influence, delegate, listen, and make room for others.",
    duration: "20 min",
    questions: 26,
    category: "Leadership",
    tone: "Growth",
  },
  {
    title: "Motivation Drivers",
    description: "Identify the conditions that help you stay engaged and do meaningful work.",
    duration: "10 min",
    questions: 16,
    category: "Motivation",
    tone: "Energy",
  },
]

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <div className="p-3 sm:p-6 lg:p-8">
          <div className="mb-8 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
              <div className="p-5 sm:p-8">
                <div className="mb-5 inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  3 assessments ready
                </div>
                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Welcome back, John. Choose the reflection that fits today.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Your psychometric workspace is designed to feel calm, private, and useful. Start with the assessment that matches what you want to understand.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Last score", "87%"],
                    ["Time saved", "22 min"],
                    ["Insights", "14"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-background/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-48 border-t border-border bg-secondary sm:min-h-56 lg:border-l lg:border-t-0">
                <img
                  src="/mindtrack-dashboard.svg"
                  alt="Assessment dashboard overview"
                  className="h-full min-h-48 w-full object-cover sm:min-h-56"
                />
                <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-card/95 p-3 shadow-sm backdrop-blur sm:bottom-4 sm:left-4 sm:right-4 sm:p-4">
                  <p className="text-sm font-semibold">Next best step</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Work Style Portrait pairs well with your recent Decision Patterns result.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mb-10 sm:mb-14">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">Choose an assessment</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Short, reflective assessments with results you can use.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {availableTests.map((test) => (
                <TestCard key={test.title} {...test} />
              ))}
            </div>
          </section>

          <section>
            <PreviousAttempts />
          </section>
        </div>
      </main>
    </div>
  )
}
