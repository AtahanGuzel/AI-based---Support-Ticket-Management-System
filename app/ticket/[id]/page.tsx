"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send, CheckCircle2, Bot, User } from "lucide-react"
import { toast } from "sonner"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"
import {
  api,
  type BackendTicketDetail,
  normalizeStatus,
  deptToCategory,
  relativeTime,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: "P1", className: "priority-p1" },
  2: { label: "P2", className: "priority-p2" },
  3: { label: "P3", className: "priority-p3" },
  4: { label: "P4", className: "priority-p4" },
  5: { label: "P5", className: "priority-p5" },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700 border-blue-200" },
  "in-progress": { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", className: "bg-slate-50 text-slate-600 border-slate-200" },
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<BackendTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const ticketId = Number(params.id)

  useEffect(() => {
    if (!ticketId) return
    api
      .getTicketDetail(ticketId)
      .then(setTicket)
      .catch(() => toast.error("Ticket not found"))
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [ticket?.conversation_history])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket || !user) return
    setSending(true)
    try {
      await api.addMessage(ticket.ticket_id, user.id, newMessage.trim())
      const updated = await api.getTicketDetail(ticket.ticket_id)
      setTicket(updated)
      setNewMessage("")
      toast.success("Message sent")
    } catch {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (!ticket) return
    try {
      await api.updateStatus(ticket.ticket_id, status)
      const updated = await api.getTicketDetail(ticket.ticket_id)
      setTicket(updated)
      toast.success(`Status updated to ${status}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64 flex items-center justify-center">
          <p className="text-muted-foreground">Loading ticket...</p>
        </main>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64 flex items-center justify-center">
          <p className="text-muted-foreground">Ticket not found.</p>
        </main>
      </div>
    )
  }

  const displayStatus = normalizeStatus(ticket.status)
  const pCfg = priorityConfig[Math.min(ticket.priority, 5)] ?? priorityConfig[5]
  const sCfg = statusConfig[displayStatus] ?? statusConfig["open"]
  const isResolved = displayStatus === "resolved" || displayStatus === "closed"

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        {/* Header */}
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center gap-4 px-8">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">TK-{ticket.ticket_id}</span>
              <Badge className={cn("text-[10px] px-1.5 py-0 h-[18px] font-semibold border", pCfg.className)}>
                {pCfg.label}
              </Badge>
              <Badge className={cn("text-[10px] px-2 py-0.5 h-5 font-medium border-0", sCfg.className)}>
                {sCfg.label}
              </Badge>
            </div>
          </div>
          {!isResolved && (user?.role === "agent" || user?.role === "admin") && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus("in_progress")}
                className="text-xs"
                disabled={displayStatus === "in-progress"}
              >
                Mark In Progress
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateStatus("resolved")}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                <CheckCircle2 className="h-3 w-3" />
                Resolve
              </Button>
            </div>
          )}
        </div>

        <div className="p-8 max-w-3xl mx-auto space-y-6">
          {/* Ticket info */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <h1 className="text-base font-semibold text-foreground mb-3">{ticket.description}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Dept: {deptToCategory(ticket.department_id)}</span>
                <span>Created: {relativeTime(ticket.created_at)}</span>
                {ticket.resolved_at && <span>Resolved: {relativeTime(ticket.resolved_at)}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Conversation */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Conversation ({ticket.conversation_history.length})
            </h2>
            <div className="space-y-4">
              {ticket.conversation_history.map((msg) => {
                const isCurrentUser = user && msg.sender_id === user.id
                return (
                  <div key={msg.message_id} className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}>
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        isCurrentUser
                          ? "bg-primary text-white text-xs font-bold"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {isCurrentUser ? (
                        user.firstName[0] + user.lastName[0]
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className={cn("max-w-[75%]", isCurrentUser && "items-end flex flex-col")}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm",
                          isCurrentUser
                            ? "bg-primary text-white rounded-tr-md"
                            : "bg-white border border-border/50 text-foreground rounded-tl-md"
                        )}
                      >
                        {msg.message_body}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 px-1">
                        {relativeTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Reply */}
          {!isResolved && (
            <div className="border-t border-border/50 pt-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 flex items-end gap-2 rounded-2xl border border-border/50 bg-white px-4 py-3 shadow-sm focus-within:border-primary/50 transition-colors">
                  <textarea
                    className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[28px] max-h-[120px] leading-relaxed"
                    placeholder="Write a reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    rows={1}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
