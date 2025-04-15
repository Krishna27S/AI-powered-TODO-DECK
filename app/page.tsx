"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, Mic, Plus } from "lucide-react"
import TaskList from "@/components/task-list"
import ChatWidget from "@/components/chat-widget"
import SuggestionPanel from "@/components/suggestion-panel"
import LoginModal from "@/components/login-modal"
import type { Task } from "@/types/task"

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isRecording, setIsRecording] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { toast } = useToast()

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks")
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks))
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission()
    }
  }, [])

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registered: ", registration)
          })
          .catch((error) => {
            console.log("Service Worker registration failed: ", error)
          })
      })
    }
  }, [])

  const handleAddTask = () => {
    if (newTask.trim() === "") return

    const newTaskObj: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      createdAt: new Date().toISOString(),
    }

    setTasks([...tasks, newTaskObj])
    setNewTask("")
    setDueDate(undefined)

    toast({
      title: "Task added",
      description: `"${newTask}" has been added to your tasks.`,
    })

    // Schedule notification if due date is set
    if (dueDate && "Notification" in window) {
      const timeUntilDue = new Date(dueDate).getTime() - new Date().getTime()
      if (timeUntilDue > 0) {
        setTimeout(
          () => {
            new Notification("Task Due Soon", {
              body: `Your task "${newTask}" is due soon!`,
              icon: "/icon-192x192.png",
            })
          },
          timeUntilDue - 30 * 60 * 1000,
        ) // Notify 30 minutes before due
      }
    }
  }

  const handleToggleComplete = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
    toast({
      title: "Task deleted",
      description: "The task has been removed from your list.",
    })
  }

  const startVoiceRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      })
      return
    }

    setIsRecording(true)

    // @ts-ignore - WebkitSpeechRecognition is not in the TypeScript types
    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setNewTask(transcript)

      // Parse date from voice input (simple implementation)
      if (transcript.includes("tomorrow")) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setDueDate(tomorrow)
      } else if (transcript.includes("today")) {
        setDueDate(new Date())
      }

      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
      toast({
        title: "Voice recognition error",
        description: "There was an error with voice recognition.",
        variant: "destructive",
      })
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
  }

  const todayTasks = tasks.filter(
    (task) => !task.completed && task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString(),
  )

  const upcomingTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      new Date(task.dueDate) > new Date() &&
      new Date(task.dueDate).toDateString() !== new Date().toDateString(),
  )

  const completedTasks = tasks.filter((task) => task.completed)

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">AI Task Manager</h1>
            <Button variant="outline" onClick={() => setShowLoginModal(true)}>
              Login
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Set due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Button onClick={startVoiceRecording} variant="outline" className={cn(isRecording && "bg-red-100")}>
                <Mic className={cn("h-4 w-4", isRecording && "text-red-500")} />
              </Button>
              <Button onClick={handleAddTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {isRecording && <div className="mt-2 text-sm text-red-500 animate-pulse">Listening... Speak now</div>}
          </div>

          <SuggestionPanel tasks={tasks} />

          <Tabs defaultValue="today" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today {todayTasks.length > 0 && `(${todayTasks.length})`}</TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming {upcomingTasks.length > 0 && `(${upcomingTasks.length})`}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed {completedTasks.length > 0 && `(${completedTasks.length})`}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <TaskList tasks={todayTasks} onToggleComplete={handleToggleComplete} onDeleteTask={handleDeleteTask} />
            </TabsContent>
            <TabsContent value="upcoming">
              <TaskList tasks={upcomingTasks} onToggleComplete={handleToggleComplete} onDeleteTask={handleDeleteTask} />
            </TabsContent>
            <TabsContent value="completed">
              <TaskList
                tasks={completedTasks}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full md:w-1/3 sticky top-4">
          <ChatWidget />
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </main>
  )
}
