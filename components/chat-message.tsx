"use client"

import { cn } from "@/lib/utils"
import { Bot, User, CheckCircle2, XCircle, Lightbulb, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  askFeedback?: boolean
}

interface ChatMessageProps {
  message: Message
  onSuggestionClick?: (suggestion: string) => void
  onFeedback?: (resolved: boolean) => void
}

export function ChatMessage({ message, onSuggestionClick, onFeedback }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm",
          isUser
            ? "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600"
            : "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20"
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex max-w-[75%] flex-col gap-3", isUser && "items-end")}>
        {/* AI Label */}
        {!isUser && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/5 text-primary border-0 gap-1.5 px-2.5 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              AI Assistant
            </Badge>
          </div>
        )}

        <div
          className={cn(
            "px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-white rounded-2xl rounded-tr-md shadow-lg shadow-primary/20"
              : "bg-white border border-border/50 text-foreground rounded-2xl rounded-tl-md shadow-sm"
          )}
        >
          {message.content}
        </div>

        {/* Suggestions as highlighted cards */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="w-full space-y-3 mt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>Suggested Solutions</span>
            </div>
            <div className="grid gap-2">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="group flex items-center gap-3 w-full text-left px-4 py-3.5 bg-gradient-to-r from-slate-50 to-white border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                    {index + 1}
                  </div>
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Prompt */}
        {message.askFeedback && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 mt-2 bg-gradient-to-r from-slate-50 to-white border border-border/50 rounded-xl">
            <span className="text-sm font-medium text-foreground">Was your issue resolved?</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-9 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-500/20 transition-all"
                onClick={() => onFeedback?.(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Yes, resolved
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
                onClick={() => onFeedback?.(false)}
              >
                <XCircle className="h-4 w-4" />
                No, need help
              </Button>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[11px] text-muted-foreground/70 font-medium">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
        <Bot className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit bg-primary/5 text-primary border-0 gap-1.5 px-2.5 py-1 text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          AI Assistant
        </Badge>
        <div className="flex items-center gap-2 px-5 py-4 bg-white border border-border/50 rounded-2xl rounded-tl-md shadow-sm">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
          </div>
          <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  )
}
