"use client"

import { useEffect, useState } from "react"

interface Trait {
  name: string
  score: number
}

interface TraitBreakdownProps {
  traits: Trait[]
}

export function TraitBreakdown({ traits }: TraitBreakdownProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-foreground">Trait pattern</h2>
      
      <div className="space-y-4">
        {traits.map((trait, index) => (
          <div key={trait.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{trait.name}</span>
              <span className="text-sm font-semibold text-primary">{trait.score}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${trait.score}%` : "0%",
                  transitionDelay: `${index * 100}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
