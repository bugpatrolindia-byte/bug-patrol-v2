import { Award } from "lucide-react"

interface ResultHeaderProps {
  title: string
  description: string
  score: number
}

export function ResultHeader({ title, description, score }: ResultHeaderProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 p-5 text-center sm:space-y-6 sm:p-8 lg:text-left">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
            <Award className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Your profile snapshot</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground lg:mx-0">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-border bg-secondary p-5 sm:p-8 lg:border-l lg:border-t-0">
          <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-primary/20 bg-card shadow-sm sm:h-44 sm:w-44">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Match score
            </span>
            <span className="mt-1 text-4xl font-bold text-primary sm:text-5xl">
              {score}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
