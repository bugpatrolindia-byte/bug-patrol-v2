"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Trait {
  name: string
  score: number
}

interface ResultPdfDownloadProps {
  result: {
    title: string
    description: string
    score: number
    traits: Trait[]
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
  }
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  })

  if (current) {
    lines.push(current)
  }

  return lines
}

function createPdf(result: ResultPdfDownloadProps["result"]) {
  const commands: string[] = []
  let y = 744

  const addText = (text: string, x = 54, size = 11, maxChars = 86, gap = 16) => {
    wrapText(text, maxChars).forEach((line) => {
      commands.push(`BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(line)}) Tj ET`)
      y -= gap
    })
  }

  const addHeading = (text: string) => {
    y -= 8
    commands.push(`BT /F2 16 Tf 54 ${y} Td (${escapePdfText(text)}) Tj ET`)
    y -= 24
  }

  const addRule = () => {
    commands.push(`0.82 0.9 0.88 RG 54 ${y} m 558 ${y} l S`)
    y -= 20
  }

  commands.push("0.01 0.47 0.42 rg 54 720 504 38 re f")
  commands.push(`BT /F2 18 Tf 70 733 Td (${escapePdfText("MindTrack Psychometric Result")}) Tj ET`)
  y = 690

  addText(result.title, 54, 20, 48, 24)
  addText(result.description, 54, 11, 88, 15)
  y -= 8
  addRule()

  addHeading("Overall Score")
  addText(`${result.score}% match score`, 54, 14, 80, 18)
  addText("Use this as a conversation starter, not a fixed label. Your patterns can shift with context, support, and practice.")

  addHeading("Trait Pattern")
  result.traits.forEach((trait) => {
    addText(`${trait.name}: ${trait.score}%`, 70, 11, 80, 15)
  })

  addHeading("Strengths")
  result.strengths.forEach((item) => addText(`- ${item}`, 70, 11, 78, 15))

  addHeading("Areas for Growth")
  result.weaknesses.forEach((item) => addText(`- ${item}`, 70, 11, 78, 15))

  addHeading("Suggestions")
  result.suggestions.forEach((item) => addText(`- ${item}`, 70, 11, 78, 15))

  const stream = commands.join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return pdf
}

export function ResultPdfDownload({ result }: ResultPdfDownloadProps) {
  const handleDownload = () => {
    const pdf = createPdf(result)
    const blob = new Blob([pdf], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "mindtrack-psychometric-result.pdf"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      onClick={handleDownload}
      className="h-12 w-full gap-2 border-border px-6 transition-all duration-200 hover:bg-secondary/80 sm:w-auto"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </Button>
  )
}
