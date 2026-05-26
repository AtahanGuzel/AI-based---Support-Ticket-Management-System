"use client"

import { Bot, Sparkles, ThumbsUp, ThumbsDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
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
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex max-w-[75%] flex-col gap-3", isUser && "items-end")}>
        {/* Sender + time */}
        <div className="flex items-center gap-2">
          {!isUser && <Sparkles className="h-3 w-3 text-primary" />}
          <span className="text-xs font-medium text-muted-foreground">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Bubble */}
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

        {/* Suggestions */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            <p className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="h-px flex-1 bg-border/50" />
              Suggested actions
              <span className="h-px flex-1 bg-border/50" />
            </p>
            {message.suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="group flex items-center gap-3 w-full text-left px-4 py-3.5 bg-gradient-to-r from-slate-50 to-white border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                  {i + 1}
                </div>
                <span className="text-sm text-foreground font-medium">{suggestion}</span>
              </button>
            ))}
          </div>
        )}

        {/* Feedback */}
        {!isUser && message.askFeedback && onFeedback && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 mt-2 bg-gradient-to-r from-slate-50 to-white border border-border/50 rounded-xl w-full">
            <div>
              <p className="text-sm font-semibold text-foreground">Was your issue resolved?</p>
              <p className="text-xs text-muted-foreground">Your feedback helps us improve</p>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onFeedback(true)}
              >
                <ThumbsUp className="h-3 w-3" />
                Yes, resolved
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onFeedback(false)}
              >
                <ThumbsDown className="h-3 w-3" />
                Create ticket
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
