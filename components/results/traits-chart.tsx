interface Trait {
  name: string
  score: number
}

interface TraitsChartProps {
  traits: Trait[]
}

const traitNotes: Record<string, string> = {
  Clarity: "You make sense of complexity by naming what matters first.",
  Imagination: "You add new angles when there is room to explore.",
  Connection: "You notice people, tone, and team dynamics.",
  Composure: "You stay steady when pressure starts to rise.",
  Analysis: "You like evidence, structure, and a well-reasoned path.",
}

function getBand(score: number) {
  if (score >= 85) return "Leading strength"
  if (score >= 70) return "Reliable pattern"
  return "Growth edge"
}

export function TraitsChart({ traits }: TraitsChartProps) {
  const sortedTraits = [...traits].sort((a, b) => b.score - a.score)
  const topTrait = sortedTraits[0]
  const growthTrait = sortedTraits[sortedTraits.length - 1]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Balance map</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          This card turns the scores into practical signals: what is strongest, what is steady, and where to stretch.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-secondary p-4">
          <p className="text-xs font-medium text-muted-foreground">Strongest signal</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{topTrait.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{topTrait.score}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Best growth area</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{growthTrait.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{growthTrait.score}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedTraits.map((trait) => (
          <div key={trait.name} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{trait.name}</p>
                <p className="mt-1 text-xs font-medium text-primary">{getBand(trait.score)}</p>
              </div>
              <span className="text-lg font-semibold text-foreground">{trait.score}%</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {traitNotes[trait.name] || "This trait adds useful context to your profile."}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
