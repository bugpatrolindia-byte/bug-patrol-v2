import { Sparkles, AlertCircle, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InsightCardsProps {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export function InsightCards({ strengths, weaknesses, suggestions }: InsightCardsProps) {
  const cards = [
    {
      title: "Strengths",
      icon: Sparkles,
      items: strengths,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      borderColor: "border-emerald-100",
    },
    {
      title: "Areas for Growth",
      icon: AlertCircle,
      items: weaknesses,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-700",
      borderColor: "border-rose-100",
    },
    {
      title: "Suggestions",
      icon: Lightbulb,
      items: suggestions,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
      borderColor: "border-sky-100",
    },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-foreground">Insights</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card 
            key={card.title} 
            className={`rounded-lg border ${card.borderColor} shadow-none transition-shadow duration-200 hover:shadow-sm`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
                <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {card.items.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                    <span className="mt-1 text-muted-foreground/50">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
