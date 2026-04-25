"use client"

import { useState, useRef, useEffect } from "react"
import { ChatMessage, TypingIndicator, type Message } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Sparkles, MessageSquarePlus, Zap, Mail, Wifi, Monitor, Key, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { useMockTickets } from "@/components/mock-tickets-provider"
import type { MockSupportTicket } from "@/lib/mock-support-tickets"

const quickActions = [
  { label: "Email issues", icon: Mail },
  { label: "VPN not connecting", icon: Wifi },
  { label: "Software installation", icon: Monitor },
  { label: "Password reset", icon: Key },
  { label: "Hardware problem", icon: HardDrive },
]

const aiResponses = [
  {
    content: "I understand you're experiencing an issue. Let me help you troubleshoot this.\n\nBased on your description, here are the most effective solutions that have worked for similar cases:",
    suggestions: ["Restart the application", "Clear cache and cookies", "Check network connection"],
    askFeedback: false,
  },
  {
    content: "I've analyzed your issue and found similar cases in our knowledge base.\n\nThe most common fix involves these steps:\n\n1. First, try restarting the service\n2. If that doesn't work, check your configuration settings\n3. Ensure all required permissions are granted\n\nWould you like me to walk you through any of these steps?",
    suggestions: ["Yes, guide me through step 1", "I need more details", "Create a ticket instead"],
    askFeedback: false,
  },
  {
    content: "Thank you for trying those steps! Based on your feedback, it seems like this issue requires further investigation by our support team.\n\nI've prepared a ticket with all the details from our conversation. The ticket will be automatically assigned to the appropriate department.",
    suggestions: [],
    askFeedback: true,
  },
]

export function ChatInterface() {
  const { user } = useAuth()
  const { tickets, setTickets } = useMockTickets()
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [responseIndex, setResponseIndex] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (content: string, files?: File[]) => {
    if (!content && !files) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: files ? `${content}\n\n[${files.length} file(s) attached]` : content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response
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

  const handleFeedback = (resolved: boolean) => {
    if (resolved) {
      toast.success("Great! Glad we could help!", {
        description: "Your conversation has been saved for future reference.",
      })
    } else {
      toast.info("Creating support ticket...", {
        description: "A support agent will follow up with you soon.",
      })
      // Add new ticket
      const newTicket: MockSupportTicket = {
        id: `TK-${1235 + tickets.length}`,
        title: messages[0]?.content.slice(0, 50) || "Support Request",
        priority: 3,
        status: "open",
        category: "General",
        requesterEmail: user?.email || "customer@example.com",
      }
      setTickets((prev) => [newTicket, ...prev])
    }
  }

  const handleQuickAction = (action: string) => {
    handleSend(action)
  }

  const startNewChat = () => {
    setMessages([])
    setResponseIndex(0)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
        {/* Chat Header */}
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
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={startNewChat}
              className="gap-2 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Chat
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              {/* Hero Section */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl opacity-60" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">
                Describe your issue and I&apos;ll help you find a solution or create a support ticket if needed.
              </p>
              
              {/* Quick Actions */}
              <div className="w-full max-w-xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-muted-foreground">Quick Actions</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.label)}
                      className="group flex items-center gap-3 px-4 py-3.5 bg-white border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-3xl mx-auto">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                  onFeedback={handleFeedback}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>

    </div>
  )
}
