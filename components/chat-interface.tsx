"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Bot, User, RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatInput } from "@/components/chat-input"
import { ChatMessage } from "@/components/chat-message"
import { TicketTracker, type TrackerTicket } from "@/components/ticket-tracker"
import { useAuth } from "@/components/auth-provider"
import {
  api,
  normalizeStatus,
  deptToCategory,
  relativeTime,
} from "@/lib/api"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  askFeedback?: boolean
}

const aiResponses = [
  {
    content:
      "I understand you're experiencing an issue. Let me help you troubleshoot this.\n\nBased on your description, here are the most effective solutions that have worked for similar cases:",
    suggestions: ["Restart the application", "Clear cache and cookies", "Check network connection"],
    askFeedback: false,
  },
  {
    content:
      "I've analyzed your issue and found similar cases in our knowledge base.\n\nThe most common fix involves these steps:\n\n1. First, try restarting the service\n2. If that doesn't work, check your configuration settings\n3. Ensure all required permissions are granted\n\nWould you like me to walk you through any of these steps?",
    suggestions: ["Yes, guide me through step 1", "I need more details", "Create a ticket instead"],
    askFeedback: false,
  },
  {
    content:
      "Thank you for trying those steps! Based on your feedback, it seems like this issue requires further investigation by our support team.\n\nI've prepared a ticket with all the details from our conversation. The ticket will be automatically assigned to the appropriate department.",
    suggestions: [],
    askFeedback: true,
  },
]

const quickActions = [
  { label: "Can't access my account", icon: "🔐" },
  { label: "Software installation help", icon: "💻" },
  { label: "Network connectivity issue", icon: "🌐" },
  { label: "Request new equipment", icon: "🖥️" },
]

export function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [responseIndex, setResponseIndex] = useState(0)
  const [liveTickets, setLiveTickets] = useState<TrackerTicket[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    api
      .getMyTickets(user.id)
      .then((data) => {
        const tickets: TrackerTicket[] = data
          .filter((t) => normalizeStatus(t.status) !== "resolved" && normalizeStatus(t.status) !== "closed")
          .map((t) => ({
            id: `TK-${t.ticket_id}`,
            ticketId: t.ticket_id,
            title: t.description,
            priority: Math.min(t.priority, 5),
            status: normalizeStatus(t.status),
            category: deptToCategory(t.department_id),
            createdAt: relativeTime(t.created_at),
          }))
        setLiveTickets(tickets)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSend = async (content: string, files?: File[]) => {
    if (!content && !files?.length) return
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: files?.length ? `${content}\n\n[${files.length} file(s) attached]` : content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))
    setIsTyping(false)
    const response = aiResponses[responseIndex % aiResponses.length]
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.content,
      timestamp: new Date(),
      suggestions: response.suggestions,
      askFeedback: response.askFeedback,
    }
    setMessages((prev) => [...prev, aiMessage])
    setResponseIndex((prev) => prev + 1)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion)
  }

  const handleFeedback = async (resolved: boolean) => {
    if (resolved) {
      toast.success("Great! Glad we could help!", {
        description: "Your conversation has been saved for future reference.",
      })
    } else {
      if (!user) {
        toast.error("You must be logged in to submit a ticket")
        return
      }
      toast.info("Creating support ticket...", {
        description: "A support agent will follow up with you soon.",
      })
      try {
        const firstMessage = messages.find((m) => m.role === "user")
        const description = firstMessage?.content.slice(0, 200) || "Support Request"
        const result = await api.submitTicket(user.id, description)
        toast.success(`Ticket created: TK-${result.ticket_id}`)
        // Refresh live tickets
        const data = await api.getMyTickets(user.id)
        const tickets: TrackerTicket[] = data
          .filter((t) => normalizeStatus(t.status) !== "resolved")
          .map((t) => ({
            id: `TK-${t.ticket_id}`,
            ticketId: t.ticket_id,
            title: t.description,
            priority: Math.min(t.priority, 5),
            status: normalizeStatus(t.status),
            category: deptToCategory(t.department_id),
            createdAt: relativeTime(t.created_at),
          }))
        setLiveTickets(tickets)
      } catch {
        toast.error("Failed to create ticket")
      }
    }
  }

  const startNewChat = () => {
    setMessages([])
    setResponseIndex(0)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Chat panel */}
      <div className="flex flex-1 flex-col rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">AI Support Assistant</h1>
              <p className="text-sm text-muted-foreground">Get instant help with your IT issues</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={startNewChat} className="gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl opacity-60" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Hi, {user?.firstName ?? "there"}! 👋
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                I&apos;m your AI support assistant. Describe your issue and I&apos;ll help you resolve it instantly.
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick actions</span>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.label)}
                    className="group flex items-center gap-3 px-4 py-3.5 bg-white border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 text-left"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors text-base">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                  onFeedback={handleFeedback}
                />
              ))}
              {isTyping && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-5 py-4 bg-white border border-border/50 rounded-2xl rounded-tl-md shadow-sm">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>

      {/* Ticket tracker */}
      <TicketTracker tickets={liveTickets} />
    </div>
  )
}
