"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import type { Task } from "@/types/task"

interface SuggestionPanelProps {
  tasks: Task[]
}

export default function SuggestionPanel({ tasks }: SuggestionPanelProps) {
  const [suggestion, setSuggestion] = useState<{
    type: "no-tasks" | "due-soon" | "completed" | null
    task?: Task
  }>({ type: null })

  useEffect(() => {
    // Check if there are no tasks for today
    const todayTasks = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString(),
    )

    if (tasks.length === 0 || todayTasks.length === 0) {
      setSuggestion({ type: "no-tasks" })
      return
    }

    // Check if there are tasks due soon (within 24 hours)
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const tasksDueSoon = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate) > now && new Date(task.dueDate) < in24Hours,
    )

    if (tasksDueSoon.length > 0) {
      setSuggestion({ type: "due-soon", task: tasksDueSoon[0] })
      return
    }

    // Check if there are recently completed tasks
    const recentlyCompleted = tasks.filter(
      (task) => task.completed && new Date(task.createdAt).getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000,
    )

    if (recentlyCompleted.length > 0) {
      setSuggestion({ type: "completed" })
      return
    }

    setSuggestion({ type: null })
  }, [tasks])

  if (!suggestion.type) return null

  return (
    <Alert className="mb-6">
      {suggestion.type === "no-tasks" && (
        <>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No tasks for today</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>You haven't added any tasks for today. Need help planning your day?</p>
            <Button variant="outline" size="sm" className="self-start">
              Get suggestions
            </Button>
          </AlertDescription>
        </>
      )}

      {suggestion.type === "due-soon" && suggestion.task && (
        <>
          <Clock className="h-4 w-4" />
          <AlertTitle>Task due soon</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>Your task "{suggestion.task.title}" is due soon. Want to reschedule?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Reschedule
              </Button>
              <Button variant="outline" size="sm">
                Mark as done
              </Button>
            </div>
          </AlertDescription>
        </>
      )}

      {suggestion.type === "completed" && (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Great progress!</AlertTitle>
          <AlertDescription>
            <p>You've completed several tasks recently. Keep up the good work!</p>
          </AlertDescription>
        </>
      )}
    </Alert>
  )
}
