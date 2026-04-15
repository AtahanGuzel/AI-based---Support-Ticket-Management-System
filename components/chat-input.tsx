"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, Send, X, FileText, ImageIcon, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = "Describe your issue in detail..." }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSend(message.trim(), files.length > 0 ? files : undefined)
      setMessage("")
      setFiles([])
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 text-primary" />
    }
    return <FileText className="h-4 w-4 text-amber-500" />
  }

  return (
    <div className="sticky bottom-0 border-t border-border/50 bg-gradient-to-t from-card via-card to-card/95 p-5">
      {/* File Preview */}
      {files.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-border/50 px-3.5 py-2.5 text-sm group"
            >
              {getFileIcon(file)}
              <span className="max-w-[150px] truncate text-foreground font-medium">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="rounded-full p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 flex items-end gap-2 rounded-2xl border border-border/50 bg-white px-4 py-3 shadow-sm focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 py-1",
              "min-h-[28px] max-h-[180px] leading-relaxed"
            )}
          />
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.log"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Paperclip className="h-[18px] w-[18px]" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
              disabled={disabled}
            >
              <Mic className="h-[18px] w-[18px]" />
              <span className="sr-only">Voice input</span>
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && files.length === 0)}
          size="icon"
          className="h-12 w-12 shrink-0 rounded-xl btn-primary-gradient transition-all disabled:opacity-40 disabled:shadow-none"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      
      {/* Helper text */}
      <p className="mt-3 text-center text-xs text-muted-foreground/60">
        Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Shift + Enter</kbd> for new line
      </p>
    </div>
  )
}
