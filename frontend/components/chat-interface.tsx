"use client"

import { useState, useRef, useEffect } from "react"
import { ChatMessage, TypingIndicator, type Message } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Sparkles, MessageSquarePlus, Zap, Mail, Wifi, Monitor, Key, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { apiAnalyze, apiSubmitTicket, apiStoreTicket, apiCheckDuplicate, apiGetDepartments, apiSendMessage, apiDeleteSession, type Department } from "@/lib/api"

const quickActions = [
  { label: "Email issues", icon: Mail },
  { label: "VPN not connecting", icon: Wifi },
  { label: "Software installation", icon: Monitor },
  { label: "Password reset", icon: Key },
  { label: "Hardware problem", icon: HardDrive },
]

export function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const _pendingSolution = useRef<string>("")
  const _skipDuplicateCheck = useRef(false)
  const _pendingUrgency = useRef<number>(3)
  const _pendingDepartment = useRef<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const sessionId = useRef(crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    apiGetDepartments().then(setDepartments).catch(() => {})
  }, [])

  const getDepartmentId = (deptName: string | null): number => {
    console.log("getDepartmentId called with:", deptName)
    const deptNameMap: Record<string, number> = {
      "HR": 1,
      "IT": 2,
      "Finance": 7,
      "Other": 8,
    }
    
    if (deptName && deptNameMap[deptName]) {
      return deptNameMap[deptName]
    }
    
    if (!deptName) return departments[0]?.department_id ?? 1
    
    const match = departments.find(
      (d) => d.department_name.toLowerCase() === deptName.toLowerCase()
    )
    return match?.department_id ?? departments[0]?.department_id ?? 1
  }

  const createTicket = async (description: string, departmentId: number, priority: number = 5) => {
    console.log("Creating ticket with departmentId:", departmentId)
    try {
      const result = await apiSubmitTicket(departmentId, description, priority)
      await apiStoreTicket(`TK-${result.ticket_id}`, description)
      return result.ticket_id
    } catch {
      return null
    }
  }

  const saveConversationToTicket = async (ticketId: number) => {
    try {
      // Skip first message — backend already saves description as first message
      const remainingMessages = messages.slice(1)
      for (const msg of remainingMessages) {
        await apiSendMessage(ticketId, `[${msg.role.toUpperCase()}]: ${msg.content}`)
      }
    } catch {
      // non-blocking
    }
  }

  const handleSend = async (content: string, files?: File[]) => {
    console.log("Sending to AI:", process.env.NEXT_PUBLIC_AI_URL)
    
    if (!content && !files) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: files ? `${content}\n\n[${files.length} file(s) attached]` : content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    setIsTyping(true)

    try {
      const userId = String(user?.userId ?? user?.email ?? "anonymous")
      const result = await apiAnalyze(userId, sessionId.current, content)
      console.log("AI result:", result)
      console.log("urgency:", result.urgency, "priority:", 6 - result.urgency)

      setIsTyping(false)

      if (result.intent === "create_ticket") {
        const deptId = getDepartmentId(result.department)
        const ticketId = await createTicket(content, deptId, 6 - result.urgency)
if (ticketId) {
  apiDeleteSession(sessionId.current)
  sessionId.current = crypto.randomUUID()
  const allMessages = [...messages, userMessage]
  for (const msg of allMessages) {
    await apiSendMessage(ticketId, `[${msg.role.toUpperCase()}]: ${msg.content}`)
  }
  // Also save the AI response
  await apiSendMessage(ticketId, `[ASSISTANT]: ${result.response_to_user}`)
}
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: ticketId
            ? `${result.response_to_user}\n\n✅ Ticket #${ticketId} has been created and assigned to the ${result.department ?? "support"} team.`
            : result.response_to_user,
          timestamp: new Date(),
          suggestions: [],
          askFeedback: false,
        }
        setMessages((prev) => [...prev, aiMessage])

        if (ticketId) {
          apiDeleteSession(sessionId.current)
  sessionId.current = crypto.randomUUID()
          toast.success(`Ticket #${ticketId} created`, {
            description: `Assigned to ${result.department ?? "support"} team.`,
          })
        }
      } else if (result.intent === "suggest_solution") {
        _pendingDepartment.current = result.department  // ADD THIS
        _pendingUrgency.current = result.urgency
        console.log("Stored department for suggest_solution:", result.department)
        const bubbleLabel = result.kb_title 
          ? `${result.kb_title} — click for instructions`
          : "View solution — click for instructions"
      
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I found a solution in our knowledge base.",
          timestamp: new Date(),
          suggestions: [bubbleLabel],
          askFeedback: false,
        }
        setMessages((prev) => [...prev, aiMessage])
      
        // Store full solution so clicking the bubble sends it
        _pendingSolution.current = result.response_to_user
      } else if (result.intent === "duplicate_found") {
        _pendingDepartment.current = result.department
        _pendingUrgency.current = result.urgency
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.response_to_user,
          timestamp: new Date(),
          suggestions: [],
          askFeedback: true,
          feedbackLabels: { yes: "Follow up on existing ticket", no: "Create a new ticket instead" },
        }
        setMessages((prev) => [...prev, aiMessage])
      }else {
        // clarify
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.response_to_user,
          timestamp: new Date(),
          suggestions: [],
          askFeedback: false,
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (err) {
      setIsTyping(false)
      toast.error("AI service unavailable", { description: "Please try again." })
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (_pendingSolution.current) {
      const solution = _pendingSolution.current
      _pendingSolution.current = ""
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: solution,
        timestamp: new Date(),
        suggestions: [],
        askFeedback: true,
      }
      setMessages((prev) => [...prev, aiMessage])
    } else if (suggestion === "Create a new ticket instead") {
      const firstUserMessage = messages.find((m) => m.role === "user")?.content ?? "Support Request"
      const deptId = getDepartmentId(_pendingDepartment.current)
      _pendingDepartment.current = null
      createTicket(firstUserMessage, deptId, 3).then(async (ticketId) => {
        if (ticketId) {
          // Save conversation
          for (const msg of messages) {
            await apiSendMessage(ticketId, `[${msg.role.toUpperCase()}]: ${msg.content}`)
          }
          toast.success(`Ticket #${ticketId} created`)
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `✅ Ticket #${ticketId} has been created for you. A support agent will follow up shortly.`,
            timestamp: new Date(),
            suggestions: [],
            askFeedback: false,
          }
          setMessages((prev) => [...prev, aiMessage])
        }
      })
    } else {
      handleSend(suggestion)
    }
  }
  const handleFeedback = async (resolved: boolean) => {
    if (resolved) {
      toast.success("Great! Glad we could help!", {
        description: "Your conversation has been saved for future reference.",
      })
      return
    }
    console.log("handleFeedback _pendingDepartment:", _pendingDepartment.current)
  
    const firstUserMessage = messages.find((m) => m.role === "user")?.content ?? "Support Request"
  
    // Skip duplicate check if we already showed a duplicate warning
    const lastAiMessage = [...messages].reverse().find(m => m.role === "assistant")
    const alreadyShownDuplicate = lastAiMessage?.feedbackLabels !== undefined
  
    if (!alreadyShownDuplicate) {
      try {
        const checkResult = await apiCheckDuplicate(firstUserMessage)
        if (checkResult.duplicate_found) {
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: checkResult.response_to_user,
            timestamp: new Date(),
            suggestions: [],
            askFeedback: true,
            feedbackLabels: { yes: "Follow up on existing ticket", no: "Create a new ticket instead" },
          }
          setMessages((prev) => [...prev, aiMessage])
          return
        }
      } catch {}
    }
  
    // No duplicate — create ticket
    const deptId = getDepartmentId(_pendingDepartment.current)
    _pendingDepartment.current = null
    const ticketId = await createTicket(firstUserMessage, deptId, 6 - _pendingUrgency.current)
  
    if (ticketId) {
      for (const msg of messages) {
        await apiSendMessage(ticketId, `[${msg.role.toUpperCase()}]: ${msg.content}`)
      }
      toast.success(`Ticket #${ticketId} created`, {
        description: "A support agent will follow up with you soon.",
      })
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Ticket #${ticketId} has been created for you. A support agent will follow up shortly.`,
        timestamp: new Date(),
        suggestions: [],
        askFeedback: false,
      }
      setMessages((prev) => [...prev, aiMessage])
    } else {
      toast.error("Failed to create ticket. Please try again.")
    }
  }

  const handleQuickAction = (action: string) => {
    handleSend(action)
  }

  const startNewChat = () => {
    apiDeleteSession(sessionId.current)
    setMessages([])
    sessionId.current = crypto.randomUUID()
    _pendingSolution.current = ""
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
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

        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  )
}