"use client"

import { useState } from "react"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Pencil } from "lucide-react"

interface Option {
  text: string
  score: number
}

interface Question {
  id: number
  text: string
  options: Option[]
}

export default function TestsManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [testTitle, setTestTitle] = useState("")
  const [testDescription, setTestDescription] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [currentOptions, setCurrentOptions] = useState<Option[]>([
    { text: "", score: 0 },
    { text: "", score: 0 },
    { text: "", score: 0 },
    { text: "", score: 0 },
  ])
  const [editingId, setEditingId] = useState<number | null>(null)

  const addOption = () => {
    setCurrentOptions([...currentOptions, { text: "", score: 0 }])
  }

  const updateOption = (index: number, field: "text" | "score", value: string | number) => {
    const updated = [...currentOptions]
    updated[index] = { ...updated[index], [field]: value }
    setCurrentOptions(updated)
  }

  const removeOption = (index: number) => {
    if (currentOptions.length > 2) {
      setCurrentOptions(currentOptions.filter((_, i) => i !== index))
    }
  }

  const addQuestion = () => {
    if (!currentQuestion.trim()) return
    
    const validOptions = currentOptions.filter(o => o.text.trim())
    if (validOptions.length < 2) return

    if (editingId !== null) {
      setQuestions(questions.map(q => 
        q.id === editingId 
          ? { ...q, text: currentQuestion, options: validOptions }
          : q
      ))
      setEditingId(null)
    } else {
      setQuestions([
        ...questions,
        { id: Date.now(), text: currentQuestion, options: validOptions }
      ])
    }

    setCurrentQuestion("")
    setCurrentOptions([
      { text: "", score: 0 },
      { text: "", score: 0 },
      { text: "", score: 0 },
      { text: "", score: 0 },
    ])
  }

  const editQuestion = (question: Question) => {
    setCurrentQuestion(question.text)
    setCurrentOptions([...question.options])
    setEditingId(question.id)
  }

  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminNavbar title="Manage Tests" onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="max-w-5xl p-3 sm:p-6 lg:p-8">
          {/* Test Details */}
          <Card className="border-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Title</label>
                <Input
                  placeholder="e.g., Cognitive Assessment"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of the test..."
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="max-w-lg resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Question Builder */}
          <Card className="border-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Edit Question" : "Add Question"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Text</label>
                <Textarea
                  placeholder="Enter your question..."
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Options</label>
                {currentOptions.map((option, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:flex sm:items-center sm:border-0 sm:p-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => updateOption(index, "text", e.target.value)}
                      className="min-w-0 flex-1"
                    />
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <label className="text-xs text-muted-foreground">Score</label>
                      <Input
                        type="number"
                        value={option.score}
                        onChange={(e) => updateOption(index, "score", parseInt(e.target.value) || 0)}
                        className="w-full sm:w-20"
                      />
                    </div>
                    {currentOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-full justify-center text-muted-foreground hover:text-destructive sm:h-8 sm:w-8 sm:shrink-0"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={addOption}
                  className="w-full gap-2 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
                <Button onClick={addQuestion} className="w-full gap-2 sm:w-auto">
                  <Plus className="h-4 w-4" />
                  {editingId ? "Update Question" : "Add Question"}
                </Button>
                {editingId && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null)
                      setCurrentQuestion("")
                      setCurrentOptions([
                        { text: "", score: 0 },
                        { text: "", score: 0 },
                        { text: "", score: 0 },
                        { text: "", score: 0 },
                      ])
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          {questions.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Questions ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, qIndex) => (
                  <div
                    key={question.id}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary shrink-0 mt-0.5">
                          {qIndex + 1}
                        </div>
                        <p className="min-w-0 text-sm font-medium">{question.text}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => editQuestion(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 sm:ml-9 sm:space-y-1.5">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-muted-foreground">
                              {String.fromCharCode(65 + oIndex)}.
                            </span>
                            <span className="min-w-0 break-words">{option.text}</span>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {option.score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button size="lg" disabled={!testTitle || questions.length === 0} className="w-full sm:w-auto">
              Save Test
            </Button>
          </div>
        </main>
      </div>
    </>
  )
}
