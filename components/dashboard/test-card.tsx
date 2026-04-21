import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, FileQuestion, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface TestCardProps {
  title: string
  description: string
  duration: string
  questions: number
  category: string
  tone?: string
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  "Personality": { bg: "bg-teal-50", text: "text-teal-700" },
  "Cognitive": { bg: "bg-sky-50", text: "text-sky-700" },
  "Social": { bg: "bg-rose-50", text: "text-rose-700" },
  "Wellbeing": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Leadership": { bg: "bg-amber-50", text: "text-amber-700" },
  "Motivation": { bg: "bg-lime-50", text: "text-lime-700" },
}

export function TestCard({ title, description, duration, questions, category, tone }: TestCardProps) {
  const colors = categoryColors[category] || categoryColors["Personality"]
  
  return (
    <div className="group relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md sm:min-h-72 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colors.bg)}>
          <FileQuestion className={cn("h-5 w-5", colors.text)} />
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", colors.bg, colors.text)}>
          {category}
        </span>
      </div>
      
      <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h3>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {tone && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {tone}
        </div>
      )}
      
      <div className="mb-5 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {duration}
        </span>
        <span className="flex items-center gap-1.5">
          <FileQuestion className="h-3.5 w-3.5" />
          {questions} questions
        </span>
      </div>

      <Button asChild className="h-10 w-full gap-2 rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 group-hover:gap-3">
        <Link href="/quiz">
          Start Test
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </Button>
    </div>
  )
}
