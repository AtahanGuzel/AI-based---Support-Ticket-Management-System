"use client"

import { use, useRef, useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  User,
  Clock,
  Monitor,
  Globe,
  Smartphone,
  Building2,
  Sparkles,
  UserPlus,
  CheckCircle2,
  MessageSquare,
  Bot,
  Send,
  Calendar,
  Activity,
  FileText,
  Paperclip,
  Mic,
  X,
  ImageIcon,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { apiGetTicket, apiSendMessage, apiUpdateTicketStatus } from "@/lib/api"
import type { ApiTicketDetail } from "@/lib/api"

// ── Display config (unchanged) ────────────────────────────────────────────────

const priorityConfig = {
  1: { label: "P1 - Critical", className: "priority-p1" },
  2: { label: "P2 - High", className: "priority-p2" },
  3: { label: "P3 - Medium", className: "priority-p3" },
  4: { label: "P4 - Low", className: "priority-p4" },
  5: { label: "P5 - Minor", className: "priority-p5" },
}

const statusConfig = {
  "open": { label: "Open", className: "bg-primary/10 text-primary" },
  "in-progress": { label: "In Progress", className: "bg-amber-50 text-amber-600" },
  "resolved": { label: "Resolved", className: "bg-emerald-50 text-emerald-600" },
}

// ── API → UI mapping ──────────────────────────────────────────────────────────

function formatTs(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function mapApiToTicket(data: ApiTicketDetail) {
  // status: API uses "in_progress" / "closed" / "merged"; UI uses "in-progress" / "resolved"
  const statusMap: Record<string, "open" | "in-progress" | "resolved"> = {
    open: "open",
    in_progress: "in-progress",
    resolved: "resolved",
    closed: "resolved",
    merged: "resolved",
  }

  // Derive a short title from the first sentence of the description
  const firstSentence = data.description.match(/^[^.!?\n]+[.!?]?/)?.[0]?.trim() ?? ""
  const title = firstSentence.length > 5 ? firstSentence : `Ticket #${data.ticket_id}`

  const createdAt = formatDateTime(data.created_at)
  const updatedAt = data.resolved_at ? formatDateTime(data.resolved_at) : createdAt

  // Map messages: sender_id === user_id → "user" role, everything else → "agent"
  const conversation = data.conversation_history.map((msg) => ({
    id: String(msg.message_id),
    role: (msg.message_body.startsWith("[USER]") ? "user"
      : msg.message_body.startsWith("[ASSISTANT]") ? "assistant"
      : msg.message_body.startsWith("[AGENT]") ? "agent"
      : "user") as "user" | "assistant" | "agent",
    sender: msg.message_body.startsWith("[USER]") ? "User"
      : msg.message_body.startsWith("[ASSISTANT]") ? "AI Assistant"
      : msg.message_body.startsWith("[AGENT]") ? "Support Agent"
      : "User",
    initials: msg.message_body.startsWith("[USER]") ? "U"
      : msg.message_body.startsWith("[ASSISTANT]") ? "AI"
      : msg.message_body.startsWith("[AGENT]") ? "SA"
      : "U",
    content: msg.message_body.replace(/^\[(USER|ASSISTANT|AGENT)\]: /, ""),
    timestamp: formatTs(msg.created_at),
  }))

  return {
    id: String(data.ticket_id),
    title,
    description: data.description,
    // Clamp to 1-5 and cast so priorityConfig lookup is type-safe
    priority: Math.min(5, Math.max(1, data.priority)) as 1 | 2 | 3 | 4 | 5,
    status: (statusMap[data.status] ?? "open") as "open" | "in-progress" | "resolved",
    category: "—",
    // Assignee is not exposed by the current API shape
    assignee: null as { name: string; initials: string; email: string } | null,
    // Requester name/email are not in the API; the email intentionally left blank
    // so isRequester stays false until the API exposes user details
    requester: { name: "User", initials: "U", email: "" },
    createdAt,
    updatedAt,
    department: `Dept. ${data.department_id}`,
    // System info is not in the API; placeholders keep the UI columns intact
    systemInfo: { os: "—", browser: "—", device: "—" },
    // AI summary not in the current API response
    aiSummary: "AI summary not available for this ticket.",
    conversation,
    activityLog: [
      { action: "Ticket created", timestamp: createdAt, icon: Sparkles },
      { action: `Priority set to P${data.priority}`, timestamp: createdAt, icon: Activity },
    ] as Array<{ action: string; timestamp: string; icon: React.ElementType }>,
  }
}

type MappedTicket = ReturnType<typeof mapApiToTicket>

// ── Component ─────────────────────────────────────────────────────────────────

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const numericId = parseInt(id, 10)
  const { user } = useAuth()

  // ── State ──────────────────────────────────────────────────────────────────
  const [ticketData, setTicketData]   = useState<MappedTicket | null>(null)
  const [loading, setLoading]         = useState(true)
  const [newMessage, setNewMessage]   = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [status, setStatus]           = useState<"open" | "in-progress" | "resolved">("open")
  const [isClosed, setIsClosed]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function fetchTicket() {
      setLoading(true)
      try {
        const data   = await apiGetTicket(numericId)
        const mapped = mapApiToTicket(data)
        if (!cancelled) {
          setTicketData(mapped)
          setStatus(mapped.status)
        }
      } catch {
        // ticketData stays null → "not found" screen is shown
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTicket()
    return () => { cancelled = true }
  }, [numericId])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachedFiles.length === 0) return
    try {
      await apiSendMessage(numericId, newMessage.trim())
      // Refresh conversation after sending
      const fresh  = await apiGetTicket(numericId)
      const mapped = mapApiToTicket(fresh)
      setTicketData(mapped)
      setStatus(mapped.status)
      toast.success("Message sent", { description: "Your reply has been sent to the requester." })
      setAttachedFiles([])
      setNewMessage("")
    } catch {
      toast.error("Failed to send", { description: "Could not send your message. Please try again." })
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    setAttachedFiles((prev) => [...prev, ...Array.from(event.target.files!)])
  }

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleVoiceRecord = () => {
    toast.info("Voice recording", {
      description: "Voice recording will be available soon. You can still attach audio files.",
    })
  }

  const handleAssignToMe = () => {
    toast.success("Ticket assigned", { description: "This ticket has been assigned to you." })
  }

  const handleResolve = async () => {
    try {
      await apiUpdateTicketStatus(parseInt(id), "resolved")
      setStatus("resolved")
      toast.success("Ticket resolved", { description: "This ticket has been marked as resolved." })
    } catch {
      toast.error("Failed to resolve ticket")
    }
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ProtectedPage allowedRoles={["employee", "agent", "admin"]}>
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 pl-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading ticket…</p>
          </main>
        </div>
      </ProtectedPage>
    )
  }

  // ── Error / not-found screen ───────────────────────────────────────────────
  if (!ticketData) {
    return (
      <ProtectedPage allowedRoles={["employee", "agent", "admin"]}>
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 pl-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Ticket not found.</p>
          </main>
        </div>
      </ProtectedPage>
    )
  }

  // ── Derived values (need ticket to be non-null) ────────────────────────────
  const ticket = ticketData
  const relatedTicketId   = null   // not provided by the API yet
  const isRequester = user?.role === "employee"
const canManageTicket = user?.role === "agent" || user?.role === "admin"
  const backHref          = user?.role === "employee" ? "/my-tickets" : "/dashboard"
  const backLabel         = user?.role === "employee" ? "Back to My Tickets" : "Back to Dashboard"

  const handleRequesterClose = () => {
    if (!isRequester || status !== "resolved") return
    setIsClosed(true)
    toast.success("Ticket closed", {
      description: "You confirmed the problem is solved. Ticket is removed from resolved list.",
    })
  }

  // ── Closed confirmation screen ─────────────────────────────────────────────
  if (isClosed) {
    return (
      <ProtectedPage allowedRoles={["employee", "agent", "admin"]}>
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="flex-1 pl-64 flex items-center justify-center">
            <div className="rounded-2xl border border-border/50 bg-white p-8 text-center shadow-sm max-w-md">
              <h2 className="text-xl font-semibold">Ticket closed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your resolved ticket was confirmed and removed from the resolved section.
              </p>
              <Button asChild className="mt-6">
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            </div>
          </main>
        </div>
      </ProtectedPage>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <ProtectedPage allowedRoles={["employee", "agent", "admin"]}>
      <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        {/* Header */}
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href={backHref} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">{backLabel}</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Ticket #{ticket.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {relatedTicketId && (
              <Button asChild variant="outline" className="rounded-xl border-border/50 hover:border-primary/30">
                <Link href={`/ticket/${relatedTicketId}`}>Go to related ticket #{relatedTicketId}</Link>
              </Button>
            )}
            {status !== "resolved" && (
              <>
                {canManageTicket && (
                  <Button variant="outline" className="gap-2 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all" onClick={handleAssignToMe}>
                    <UserPlus className="h-4 w-4" />
                    Assign to me
                  </Button>
                )}
                <Button className="gap-2 rounded-xl btn-primary-gradient" onClick={handleResolve}>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Resolved
                </Button>
              </>
            )}
            {status === "resolved" && isRequester && (
              <Button className="gap-2 rounded-xl btn-primary-gradient" onClick={handleRequesterClose}>
                <CheckCircle2 className="h-4 w-4" />
                Yes, problem is solved
              </Button>
            )}
          </div>
        </div>

        <div className="p-8">
        <div className={cn("grid gap-6", canManageTicket ? "grid-cols-3" : "grid-cols-1")}>
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary - Premium Highlight */}
              {canManageTicket && (
  <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-accent/5 p-6">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
    <div className="relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Summary</h3>
          <p className="text-[11px] text-muted-foreground">Generated from conversation analysis</p>
        </div>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">{ticket.aiSummary}</p>
    </div>
  </div>
)}

              {/* Ticket Details */}
              <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs font-semibold border", priorityConfig[ticket.priority].className)}>
                        {priorityConfig[ticket.priority].label}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-xs font-medium border-0", statusConfig[status].className)}>
                        {statusConfig[status].label}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-border/50 bg-slate-50">
                        {ticket.category}
                      </Badge>
                    </div>
                    <h1 className="text-xl font-bold text-foreground leading-tight">{ticket.title}</h1>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>
              </div>

              {/* Conversation History */}
              <div className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-white to-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                      <MessageSquare className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Conversation History</h3>
                      <p className="text-[11px] text-muted-foreground">{ticket.conversation.length} messages</p>
                    </div>
                  </div>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="p-6 space-y-5">
                    {ticket.conversation.map((message) => (
                      <div key={message.id} className="flex gap-4">
                        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white shadow-sm">
                          <AvatarFallback className={cn(
                            "text-xs font-semibold",
                            message.role === "assistant" ? "bg-gradient-to-br from-primary to-accent text-white" :
                            message.role === "agent" ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white" :
                            "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600"
                          )}>
                            {message.role === "assistant" ? <Bot className="h-4 w-4" /> : message.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-foreground">{message.sender}</span>
                            {message.role === "assistant" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] bg-primary/10 text-primary border-0 font-medium">
                                AI
                              </Badge>
                            )}
                            {message.role === "agent" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] bg-emerald-50 text-emerald-600 border-0 font-medium">
                                Support
                              </Badge>
                            )}
                            <span className="text-[11px] text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <div className={cn(
                            "px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap",
                            message.role === "user"
                              ? "bg-gradient-to-br from-slate-50 to-white border border-border/50 text-foreground"
                              : message.role === "assistant"
                              ? "bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 text-foreground"
                              : "bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 text-foreground"
                          )}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Reply Input */}
                <div className="px-6 py-4 border-t border-border/50 bg-gradient-to-r from-slate-50/50 to-white">
                  {attachedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {attachedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-2 rounded-lg border border-border/50 bg-white px-3 py-1.5 text-xs"
                        >
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          <span className="max-w-[180px] truncate text-foreground">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachedFile(index)}
                            className="rounded-full p-0.5 text-muted-foreground hover:bg-slate-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Input
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="rounded-xl border-border/50 bg-white shadow-sm focus:shadow-md focus:border-primary/50 transition-all"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.log,.mp3,.wav,.m4a"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl border-border/50 bg-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl border-border/50 bg-white"
                      onClick={handleVoiceRecord}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      className="gap-2 rounded-xl btn-primary-gradient shrink-0"
                      disabled={!newMessage.trim() && attachedFiles.length === 0}
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            {canManageTicket && (
            <div className="space-y-6">
              {/* System Info */}
              <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                    <Monitor className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">System Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Operating System</p>
                      <p className="text-sm font-medium text-foreground">{ticket.systemInfo.os}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Application</p>
                      <p className="text-sm font-medium text-foreground">{ticket.systemInfo.browser}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Device</p>
                      <p className="text-sm font-medium text-foreground">{ticket.systemInfo.device}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Department</p>
                      <p className="text-sm font-medium text-foreground">{ticket.department}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* People */}
              <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">People</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Requester</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                      <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600">
                          {ticket.requester.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{ticket.requester.name}</p>
                        <p className="text-[11px] text-muted-foreground">{ticket.requester.email}</p>
                      </div>
                    </div>
                  </div>
                  {ticket.assignee && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Assignee</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50">
                          <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-emerald-400 to-emerald-500 text-white">
                              {ticket.assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{ticket.assignee.name}</p>
                            <p className="text-[11px] text-muted-foreground">{ticket.assignee.email}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                    <Calendar className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Created</p>
                      <p className="text-sm text-foreground truncate">{ticket.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Last Updated</p>
                      <p className="text-sm text-foreground truncate">{ticket.updatedAt}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                    <Activity className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {ticket.activityLog.map((log, index) => (
                      <div key={index} className="flex items-start gap-3 p-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                          <log.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">{log.action}</p>
                          <p className="text-[10px] text-muted-foreground">{log.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>)}
          </div>
        </div>
      </main>
      </div>
    </ProtectedPage>
  )
}