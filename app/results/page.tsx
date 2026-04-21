import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ResultHeader } from "@/components/results/result-header"
import { TraitBreakdown } from "@/components/results/trait-breakdown"
import { TraitsChart } from "@/components/results/traits-chart"
import { InsightCards } from "@/components/results/insight-cards"
import { ResultPdfDownload } from "@/components/results/pdf-download"
import { LayoutDashboard, RotateCcw, Sparkles } from "lucide-react"
import Link from "next/link"

const resultData = {
  title: "You lead with thoughtful clarity",
  description:
    "Your profile points to someone who slows down enough to understand the shape of a situation, then moves forward with a practical plan. You tend to bring steadiness, structure, and careful listening into your work.",
  score: 87,
  traits: [
    { name: "Clarity", score: 78 },
    { name: "Imagination", score: 65 },
    { name: "Connection", score: 72 },
    { name: "Composure", score: 85 },
    { name: "Analysis", score: 92 },
  ],
  strengths: [
    "You organize ambiguity into next steps",
    "You notice details without losing the goal",
    "People can usually count on your consistency",
  ],
  weaknesses: [
    "You may spend too long refining a decision",
    "You may need more room for experimentation",
    "Delegating earlier could protect your energy",
  ],
  suggestions: [
    "Set a small timebox for low-risk decisions",
    "Invite one playful idea before choosing a plan",
    "Ask teammates what would help them own more",
  ],
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-14">
        <div className="space-y-8 sm:space-y-12">
          <ResultHeader
            title={resultData.title}
            description={resultData.description}
            score={resultData.score}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-lg border-border shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <TraitBreakdown traits={resultData.traits} />
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <TraitsChart traits={resultData.traits} />
              </CardContent>
            </Card>
          </div>

          <InsightCards
            strengths={resultData.strengths}
            weaknesses={resultData.weaknesses}
            suggestions={resultData.suggestions}
          />

          <div className="rounded-lg border border-border bg-secondary p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="text-base font-semibold">What to do with this</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Use this as a conversation starter, not a label. Your patterns can shift with context, support, and practice.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <ResultPdfDownload result={resultData} />
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full gap-2 border-border px-6 transition-all duration-200 hover:bg-secondary/80 sm:w-auto"
              asChild
            >
              <Link href="/">
                <RotateCcw className="h-4 w-4" />
                Retake Test
              </Link>
            </Button>
            <Button
              size="lg"
              className="h-12 w-full gap-2 bg-primary px-6 text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 sm:w-auto"
              asChild
            >
              <Link href="/">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
