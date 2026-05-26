"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (content: string, files?: File[]) => void
  disabled?: boolean
}

const quickActions = [
  "My computer won't start",
  "Password reset needed",
  "Software not working",
  "Request equipment",
]

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [message])

  const handleSend = () => {
    if (!message.trim() && !files.length) return
    onSend(message.trim(), files.length ? files : undefined)
    setMessage("")
    setFiles([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  return (
    <div className="sticky bottom-0 border-t border-border/50 bg-gradient-to-t from-card via-card to-card/95 p-5">
      {/* Quick actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => onSend(action)}
            disabled={disabled}
            className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-border/50 px-3.5 py-2.5 text-sm group hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            <span className="text-foreground group-hover:text-primary transition-colors">{action}</span>
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-3">
        <div className="flex-1 flex items-end gap-2 rounded-2xl border border-border/50 bg-white px-4 py-3 shadow-sm focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 transition-all duration-200">
          <textarea
            ref={textareaRef}
            className={cn(
              "flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 py-1",
              "min-h-[28px] max-h-[180px] leading-relaxed"
            )}
            placeholder="Describe your issue..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !files.length)}
          className="h-12 w-12 shrink-0 rounded-xl transition-all disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">{files.length} file(s) attached</p>
      )}
    </div>
  )
}
