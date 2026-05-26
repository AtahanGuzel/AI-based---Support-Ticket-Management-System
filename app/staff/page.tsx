"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Send, CheckCircle2, X, MessageSquare, Bot } from "lucide-react"
import { toast } from "sonner"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"
import {
  api,
  type BackendTicket,
  type BackendMessage,
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

interface UITicket {
  ticketId: number
  id: string
  title: string
  priority: number
  status: string
  category: string
  createdAt: string
  conversation: Array<{
    id: string
    sender_id: number
    message_body: string
    created_at: string
  }>
}

function toUITicket(t: BackendTicket): UITicket {
  return {
    ticketId: t.ticket_id,
    id: `TK-${t.ticket_id}`,
    title: t.description,
    priority: Math.min(t.priority, 5),
    status: normalizeStatus(t.status),
    category: deptToCategory(t.department_id),
    createdAt: relativeTime(t.created_at),
    conversation: [],
  }
}

function StaffContent() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<UITicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<UITicket | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("assigned")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api
      .getAllTickets()
      .then((data) => {
        const mapped = data.map(toUITicket)
        setTickets(mapped)
        if (mapped.length > 0) setSelectedTicket(mapped[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Load conversation for selected ticket
  useEffect(() => {
    if (!selectedTicket) return
    api
      .getTicketDetail(selectedTicket.ticketId)
      .then((detail) => {
        setTickets((prev) =>
          prev.map((t) =>
            t.ticketId === detail.ticket_id
              ? { ...t, conversation: detail.conversation_history.map((m) => ({ ...m, id: String(m.message_id) })) }
              : t
          )
        )
        setSelectedTicket((prev) =>
          prev && prev.ticketId === detail.ticket_id
            ? { ...prev, conversation: detail.conversation_history.map((m) => ({ ...m, id: String(m.message_id) })) }
            : prev
        )
      })
      .catch(console.error)
  }, [selectedTicket?.ticketId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedTicket?.conversation])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === "assigned") return matchesSearch && ticket.status !== "resolved" && ticket.status !== "closed"
    return matchesSearch && (ticket.status === "resolved" || ticket.status === "closed")
  })

  const stats = {
    assigned: tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length,
    urgent: tickets.filter((t) => t.priority <= 2 && t.status !== "resolved").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return
    setSending(true)
    try {
      await api.addMessage(selectedTicket.ticketId, user.id, newMessage.trim())
      const detail = await api.getTicketDetail(selectedTicket.ticketId)
      const conversation = detail.conversation_history.map((m) => ({ ...m, id: String(m.message_id) }))
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === selectedTicket.ticketId ? { ...t, conversation } : t))
      )
      setSelectedTicket((prev) => (prev ? { ...prev, conversation } : prev))
      setNewMessage("")
      toast.success("Message sent")
    } catch {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleResolveTicket = async () => {
    if (!selectedTicket) return
    try {
      await api.updateStatus(selectedTicket.ticketId, "resolved")
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === selectedTicket.ticketId ? { ...t, status: "resolved" } : t))
      )
      setSelectedTicket((prev) => (prev ? { ...prev, status: "resolved" } : prev))
      toast.success("Ticket resolved", {
        description: `Ticket ${selectedTicket.id} has been marked as resolved.`,
      })
    } catch {
      toast.error("Failed to resolve ticket")
    }
  }

  const handleCloseTicket = async () => {
    if (!selectedTicket) return
    try {
      await api.updateStatus(selectedTicket.ticketId, "closed")
      setTickets((prev) => prev.filter((t) => t.ticketId !== selectedTicket.ticketId))
      const remaining = filteredTickets.find((t) => t.ticketId !== selectedTicket.ticketId)
      setSelectedTicket(remaining ?? null)
      toast.success("Ticket closed")
    } catch {
      toast.error("Failed to close ticket")
    }
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        {/* Header */}
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Support Staff Panel</h1>
            <p className="text-sm text-muted-foreground">Manage and respond to tickets</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">{stats.assigned}</span>
                <span className="text-xs text-muted-foreground">Assigned</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-600">{stats.urgent}</span>
                <span className="text-xs text-muted-foreground">Urgent</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-emerald-600">{stats.resolved}</span>
                <span className="text-xs text-muted-foreground">Resolved</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-muted-foreground">
            Loading tickets...
          </div>
        ) : (
          <div className="flex h-[calc(100vh-4rem)]">
            {/* Left panel: ticket list */}
            <div className="w-80 border-r border-border/50 flex flex-col">
              <div className="p-4 border-b border-border/50 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-8 text-sm"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="assigned" className="flex-1 text-xs">
                      Active ({stats.assigned})
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="flex-1 text-xs">
                      Resolved ({stats.resolved})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredTickets.length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground">No tickets</p>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const pCfg = priorityConfig[ticket.priority] ?? priorityConfig[5]
                      const isSelected = selectedTicket?.ticketId === ticket.ticketId
                      return (
                        <button
                          key={ticket.ticketId}
                          onClick={() => setSelectedTicket(ticket)}
                          className={cn(
                            "w-full text-left rounded-xl p-3 transition-all",
                            isSelected
                              ? "bg-primary/5 border border-primary/20"
                              : "hover:bg-slate-50 border border-transparent"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-mono text-muted-foreground">{ticket.id}</span>
                                <Badge
                                  className={cn(
                                    "text-[9px] px-1 py-0 h-[16px] font-semibold border",
                                    pCfg.className
                                  )}
                                >
                                  {pCfg.label}
                                </Badge>
                              </div>
                              <p className="text-xs font-medium text-foreground line-clamp-2">{ticket.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{ticket.createdAt}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right panel: conversation */}
            {selectedTicket ? (
              <div className="flex-1 flex flex-col">
                {/* Ticket header */}
                <div className="px-6 py-4 border-b border-border/50 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{selectedTicket.id}</span>
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-[18px] font-semibold border",
                            (priorityConfig[selectedTicket.priority] ?? priorityConfig[5]).className
                          )}
                        >
                          {(priorityConfig[selectedTicket.priority] ?? priorityConfig[5]).label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 h-[18px]">
                          {selectedTicket.status}
                        </Badge>
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">{selectedTicket.title}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedTicket.category}</p>
                    </div>
                    {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCloseTicket} className="gap-1.5 text-xs">
                          <X className="h-3 w-3" />
                          Close
                        </Button>
                        <Button size="sm" onClick={handleResolveTicket} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6">
                  {selectedTicket.conversation.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTicket.conversation.map((msg) => {
                        const isAgent = user && msg.sender_id === user.id
                        return (
                          <div key={msg.id} className={cn("flex gap-3", isAgent && "flex-row-reverse")}>
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                                isAgent
                                  ? "bg-primary text-white"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {isAgent ? (user.firstName[0] + user.lastName[0]) : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={cn("max-w-[75%]", isAgent && "items-end flex flex-col")}>
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-3 text-sm",
                                  isAgent
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
                  )}
                </ScrollArea>

                {/* Reply input */}
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <div className="border-t border-border/50 p-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 flex items-end gap-2 rounded-2xl border border-border/50 bg-white px-4 py-3 shadow-sm focus-within:border-primary/50 transition-colors">
                        <textarea
                          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[28px] max-h-[120px] leading-relaxed"
                          placeholder="Type a reply..."
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
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a ticket to view the conversation</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function StaffPanelPage() {
  return (
    <ProtectedPage allowedRoles={["agent", "admin"]}>
      <StaffContent />
    </ProtectedPage>
  )
}
