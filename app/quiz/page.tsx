import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight, HeartPulse, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const questions = [
  {
    id: 1,
    text: "When something feels complex, what do you usually do first?",
    theme: "Problem solving",
    options: [
      "Break it into smaller pieces",
      "Look at it from different angles",
      "Trust my instinct and begin",
      "Ask someone I trust for input",
    ],
  },
  {
    id: 2,
    text: "In a group conversation, which role feels most natural?",
    theme: "Team energy",
    options: [
      "Organizing next steps",
      "Connecting different viewpoints",
      "Offering fresh ideas",
      "Making sure people feel heard",
    ],
  },
  {
    id: 3,
    text: "When learning something unfamiliar, what helps you settle in?",
    theme: "Learning style",
    options: [
      "Understanding the ideas first",
      "Watching someone demonstrate",
      "Trying it and adjusting as I go",
      "Talking it through with others",
    ],
  },
]

type QuizSearchParams = Record<string, string | string[] | undefined>

function getParam(params: QuizSearchParams, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

function clampQuestion(value: string | undefined) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.min(Math.max(parsed, 0), questions.length - 1)
}

function createQuizHref(params: QuizSearchParams, updates: Record<string, string | number>) {
  const nextParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    const safeValue = Array.isArray(value) ? value[0] : value
    if (safeValue !== undefined) {
      nextParams.set(key, safeValue)
    }
  })

  Object.entries(updates).forEach(([key, value]) => {
    nextParams.set(key, String(value))
  })

  return `/quiz?${nextParams.toString()}`
}

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<QuizSearchParams>
}) {
  const params = await searchParams
  const currentQuestion = clampQuestion(getParam(params, "q"))
  const question = questions[currentQuestion]
  const selectedValue = getParam(params, `a${currentQuestion}`)
  const selectedOption = selectedValue === undefined ? null : Number(selectedValue)
  const hasSelection = selectedOption !== null && Number.isFinite(selectedOption)
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const previousHref = createQuizHref(params, { q: currentQuestion - 1 })
  const nextHref = currentQuestion < questions.length - 1
    ? createQuizHref(params, { q: currentQuestion + 1 })
    : "/results"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 w-full border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:h-10 sm:w-10">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">
                Reflection {currentQuestion + 1} of {questions.length}
              </span>
              <p className="text-xs text-muted-foreground">{question.theme}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Exit Test</span>
            </Link>
          </Button>
        </div>
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-3 py-4 sm:px-6 sm:py-10">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
            <p className="text-sm font-semibold">Your pace</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pick the option that sounds most like you most of the time. This is not a performance test.
            </p>
            <div className="mt-4 grid gap-2 sm:mt-6 sm:space-y-3 lg:block">
              {questions.map((item, index) => {
                const answered = getParam(params, `a${index}`) !== undefined
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all sm:py-3",
                      index === currentQuestion
                        ? "border-primary bg-secondary text-foreground"
                        : answered
                          ? "border-border bg-background text-muted-foreground"
                          : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      answered ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {answered ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <span>{item.theme}</span>
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-8">
            <div className="mb-4 inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:mb-6">
              {Math.round(progress)}% complete
            </div>
            <h1 className="mb-5 text-xl font-semibold leading-tight text-foreground sm:mb-8 sm:text-3xl">
              {question.text}
            </h1>

            <div className="grid gap-3">
              {question.options.map((option, index) => {
                const selected = selectedOption === index
                return (
                  <Link
                    key={option}
                    href={createQuizHref(params, { q: currentQuestion, [`a${currentQuestion}`]: index })}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg border px-3 py-3.5 text-left transition-all duration-200 sm:gap-4 sm:px-4 sm:py-4",
                      "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20",
                      selected ? "border-primary bg-secondary shadow-sm" : "border-border bg-card"
                    )}
                  >
                    <span className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-base font-medium text-foreground">
                      {option}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 w-full border-t border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
          {currentQuestion === 0 ? (
            <Button
              variant="ghost"
              disabled
              className="gap-1 px-2 text-muted-foreground hover:text-foreground disabled:opacity-40 sm:gap-2 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          ) : (
            <Button
              variant="ghost"
              asChild
              className="gap-1 px-2 text-muted-foreground hover:text-foreground sm:gap-2 sm:px-4"
            >
              <Link href={previousHref}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            </Button>
          )}

          <div className="flex gap-1.5">
            {questions.map((_, index) => {
              const answered = getParam(params, `a${index}`) !== undefined
              return (
                <div
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200",
                    index === currentQuestion
                      ? "w-6 bg-primary"
                      : answered
                        ? "w-2 bg-primary/40"
                        : "w-2 bg-border"
                  )}
                />
              )
            })}
          </div>

          {hasSelection ? (
            <Button
              asChild
              className="gap-1 px-3 bg-primary text-primary-foreground hover:bg-primary/90 sm:gap-2 sm:px-4"
            >
              <Link href={nextHref}>
                {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              disabled
              className="gap-1 px-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 sm:gap-2 sm:px-4"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
