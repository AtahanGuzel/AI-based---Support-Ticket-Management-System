"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Users, DollarSign, MoreHorizontal } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiGetAllTickets, apiUpdateTicketStatus, apiGetTicket, apiSendMessage } from "@/lib/api"
import type { ApiTicket } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Bot,
  MoreVertical,
  Sparkles,
  Mail,
  Wifi,
  Shield,
  Monitor,
  RefreshCw,
  CalendarClock,
  UserMinus,
  UserPlus,
  ListOrdered,
  ArrowLeft,
  Paperclip,
  Mic,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import type { SupportCategory } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const priorityConfig = {
  1: { label: "P1", className: "priority-p1" },
  2: { label: "P2", className: "priority-p2" },
  3: { label: "P3", className: "priority-p3" },
  4: { label: "P4", className: "priority-p4" },
  5: { label: "P5", className: "priority-p5" },
}

const categoryIcons: Record<string, React.ElementType> = {
  HR: Users,
  IT: Monitor,
  Finance: DollarSign,
  Other: MoreHorizontal,
}

type TicketStatus = "open" | "in-progress" | "resolved"
type SortMode = "oldest" | "updated" | "priority"

interface TicketConversation {
  id: string
  role: "user" | "assistant" | "agent"
  sender: string
  initials: string
  content: string
  timestamp: string
}

interface ActivityEntry {
  id: string
  text: string
  time: string
}

interface StaffTicket {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  status: TicketStatus
  category: SupportCategory
  assignedTo: "me" | null
  requester: {
    name: string
    initials: string
    email: string
    phone?: string
  }
  channel: "email" | "web" | "chat"
  createdAt: string
  updatedAt: string
  isNewToday: boolean
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  conversation: TicketConversation[]
  activity: ActivityEntry[]
}

const DEPT_CATEGORY_MAP: Record<number, SupportCategory> = {
  1: "HR",
  2: "IT",
  7: "Finance",
  8: "Other",
}

function mapApiTicket(t: ApiTicket): StaffTicket {
  const createdDate = new Date(t.created_at)
  const now = new Date()
  const isNewToday =
    createdDate.getFullYear() === now.getFullYear() &&
    createdDate.getMonth() === now.getMonth() &&
    createdDate.getDate() === now.getDate()

  // Normalise the two status spaces: API uses in_progress, UI uses in-progress
  const STATUS_MAP: Record<ApiTicket["status"], TicketStatus> = {
    open: "open",
    in_progress: "in-progress",
    resolved: "resolved",
    closed: "resolved",
    merged: "resolved",
  }

  const activityTime = createdDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
  const lastMessageTime = createdDate.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  })

  const clampedPriority = (
    Math.min(Math.max(Math.round(t.priority), 1), 5)
  ) as 1 | 2 | 3 | 4 | 5

  return {
    id: `TK-${t.ticket_id}`,
    title: t.description.slice(0, 80),
    priority: clampedPriority,
    status: STATUS_MAP[t.status] ?? "open",
    category: DEPT_CATEGORY_MAP[t.department_id] ?? "Software",
    assignedTo: null,
    requester: {
      name: `User #${t.user_id}`,
      initials: "U",
      email: "",
    },
    channel: "web",
    createdAt: t.created_at,
    updatedAt: t.created_at,
    isNewToday,
    lastMessage: t.description,
    lastMessageTime,
    unreadCount: 0,
    conversation: [],
    activity: [{ id: "a1", text: "Ticket opened", time: activityTime }],
  }
}

export default function StaffPanelPage() {
  const { user } = useAuth()
  // AFTER
  const [tickets, setTickets] = useState<StaffTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const staffCategory: SupportCategory = (user?.supportCategory ?? "Software") as SupportCategory
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<any[]>([])

useEffect(() => {
  if (!selectedId) return
  const numericId = parseInt(selectedId.replace("TK-", ""))
  if (isNaN(numericId)) return
  
  apiGetTicket(numericId).then((data) => {
    setSelectedConversation(
      data.conversation_history.map((m: any) => ({
        id: String(m.message_id),
        role: m.message_body.startsWith("[USER]") ? "user" 
    : m.message_body.startsWith("[ASSISTANT]") ? "assistant"
    : m.message_body.startsWith("[AGENT]") ? "agent"
    : "user",  // default unprefixed messages to user (description)
    sender: m.message_body.startsWith("[USER]") ? "User" 
    : m.message_body.startsWith("[ASSISTANT]") ? "AI Assistant"
    : m.message_body.startsWith("[AGENT]") ? "Support Agent"
    : "User",
initials: m.message_body.startsWith("[USER]") ? "U"
    : m.message_body.startsWith("[ASSISTANT]") ? "AI"
    : m.message_body.startsWith("[AGENT]") ? "SA"
    : "U",
        content: m.message_body.replace(/^\[(USER|ASSISTANT|AGENT)\]: /, ""),
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        attachments: [],
      }))
    )
  }).catch(console.error)
}, [selectedId])
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [statusTab, setStatusTab] = useState<TicketStatus | "all">("all")
  const [sortMode, setSortMode] = useState<SortMode>("updated")
  const [lastSynced, setLastSynced] = useState(() => new Date())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [quickToday, setQuickToday] = useState(false)
  /** true = full-height ticket list; false = full-height conversation for selected ticket */
  const [showTicketList, setShowTicketList] = useState(true)

  const agentInitials = `${user?.firstName?.[0] ?? "A"}${user?.lastName?.[0] ?? "G"}`.toUpperCase()
  const agentName = `${user?.firstName ?? "Agent"} ${user?.lastName ?? ""}`.trim()

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId]
  )

  const inMyCategory = useCallback((t: StaffTicket) => t.category === staffCategory, [staffCategory])
  
  const statusCounts = useMemo(() => {
    const list = tickets.filter(inMyCategory)
    return {
      all: list.length,
      open: list.filter((t) => t.status === "open").length,
      inProgress: list.filter((t) => t.status === "in-progress").length,
      resolved: list.filter((t) => t.status === "resolved").length,
    }
  }, [tickets, inMyCategory])

  const filteredTickets = useMemo(() => {
    let list = tickets.filter(inMyCategory)

    if (statusTab !== "all") {
      list = list.filter((t) => t.status === statusTab)
    }

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.requester.name.toLowerCase().includes(q) ||
          t.requester.email.toLowerCase().includes(q)
      )
    }

    if (quickToday) {
      list = list.filter((t) => t.isNewToday)
    }

    const sorted = [...list]
    if (sortMode === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sortMode === "updated") {
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } else {
      sorted.sort((a, b) => a.priority - b.priority)
    }

    return sorted
  }, [tickets, inMyCategory, statusTab, searchQuery, quickToday, sortMode])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    apiGetAllTickets()
      .then((data) => {
        if (!cancelled) setTickets(data.map(mapApiTicket))
      })
      .catch(() => {
        // leave tickets as [] — the empty-state UI already handles this
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && tickets.some((t) => t.id === prev && t.category === staffCategory)) return prev
      return tickets.find((t) => t.category === staffCategory)?.id ?? null
    })
  }, [staffCategory, tickets])

  useEffect(() => {
    if (selectedId && !filteredTickets.some((t) => t.id === selectedId)) {
      setSelectedId(filteredTickets[0]?.id ?? null)
    }
  }, [filteredTickets, selectedId])
  useEffect(() => {
    if (selectedId && !tickets.some((t) => t.id === selectedId)) {
      setSelectedId(null)
    }
  }, [tickets, selectedId])

  useEffect(() => {
    if (!selectedTicket) setShowTicketList(true)
  }, [selectedTicket])


  const syncNow = useCallback(() => {
    setLastSynced(new Date())
    toast.message("Queue refreshed", { description: "Showing latest mock data." })
  }, [])

  const patchTicket = useCallback((id: string, patch: Partial<StaffTicket>) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
    )
  }, [])

  const appendActivity = useCallback((id: string, text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              updatedAt: new Date().toISOString(),
              activity: [{ id: crypto.randomUUID(), text, time }, ...t.activity],
            }
          : t
      )
    )
  }, [])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedFiles.length === 0) || !selectedTicket) return
    if (selectedTicket.status === "resolved") return
  
    const body = newMessage.trim()
    const attachmentSummary =
      attachedFiles.length > 0
        ? `\n\n[Attachments: ${attachedFiles.map((file) => file.name).join(", ")}]`
        : ""
    const fullMessage = `${body}${attachmentSummary}`.trim()
  
    const numericId = parseInt(selectedTicket.id.replace("TK-", ""))
    
    try {
      await apiSendMessage(numericId, `[AGENT]: ${fullMessage}`)
    } catch {
      toast.error("Failed to send message")
      return
    }
  
    const newConversation: TicketConversation = {
      id: crypto.randomUUID(),
      role: "agent",
      sender: agentName,
      initials: agentInitials,
      content: fullMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  
    setSelectedConversation((prev) => [...prev, newConversation])
    appendActivity(selectedTicket.id, "Reply sent")
    setNewMessage("")
    setAttachedFiles([])
    toast.success("Message sent")
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

  const handleResolveTicket = async () => {
    if (!selectedTicket) return
    const numericId = parseInt(selectedTicket.id.replace("TK-", ""), 10)
    try {
      await apiUpdateTicketStatus(numericId, "resolved")
    } catch {
      toast.error("Failed to resolve ticket", {
        description: "The server update failed. Please try again.",
      })
      return                        // bail — don't update local state if the API rejected it
    }
    patchTicket(selectedTicket.id, { status: "resolved" })
    appendActivity(selectedTicket.id, "Status → Resolved")
    toast.success("Ticket resolved", { description: `${selectedTicket.id} marked resolved.` })
  }

  const handleAssignToMe = () => {
    if (!selectedTicket) return
    patchTicket(selectedTicket.id, { assignedTo: "me", status: "in-progress" })
    appendActivity(selectedTicket.id, "Assigned to you")
    setStatusTab("in-progress")
    toast.success("Assigned to you")
  }

  const handleRelease = () => {
    if (!selectedTicket) return
    patchTicket(selectedTicket.id, { assignedTo: null, status: "open" })
    appendActivity(selectedTicket.id, "Released to queue · Open")
    toast.success("Returned to team queue")
  }

  const handleCloseTicket = () => {
    if (!selectedTicket) return
    const id = selectedTicket.id
    setTickets((prev) => prev.filter((t) => t.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
    setShowTicketList(true)
    toast.success("Ticket closed", { description: "Removed from your list (mock)." })
  }

  const canRequesterCloseSelectedResolvedTicket =
    selectedTicket?.status === "resolved" && user?.email === selectedTicket.requester.email

  const relativeSync = useMemo(() => {
    const s = Math.floor((Date.now() - lastSynced.getTime()) / 1000)
    if (s < 5) return "just now"
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    return `${m}m ago`
  }, [lastSynced])

  const StaffCategoryIcon = categoryIcons[staffCategory] ?? MessageSquare

  return (
    <ProtectedPage allowedRoles={["agent"]}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64">
          {isLoading ? (
            <div className="flex h-screen items-center justify-center gap-3 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading tickets…
            </div>
          ) : (
            <div className="flex h-screen min-h-0 flex-col border-b border-border/50 bg-gradient-to-b from-slate-50/40 to-white">
              {/* Top bar */}
              <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-white/90 px-4 backdrop-blur-xl">
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Staff console</h1>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{staffCategory}</span> queue · assignment and replies
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Synced {relativeSync}</span>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg" onClick={syncNow}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </header>
  
              <div className="flex min-h-0 flex-1">
                <aside className="flex w-[272px] shrink-0 flex-col border-r border-border/50 bg-white">
                  <div className="border-b border-border/50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your category</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <StaffCategoryIcon className="h-5 w-5" />
                      </div>
                      <span className="text-lg font-semibold tracking-tight text-foreground">{staffCategory}</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground">Tickets are filtered to this category for your account.</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                    {(
                      [
                        ["all", "All", statusCounts.all],
                        ["open", "Open", statusCounts.open],
                        ["in-progress", "In progress", statusCounts.inProgress],
                        ["resolved", "Resolved", statusCounts.resolved],
                      ] as const
                    ).map(([key, label, n]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setStatusTab(key as TicketStatus | "all")
                          setQuickToday(false)
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                          statusTab === key
                            ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                            : "border-transparent bg-slate-50/80 text-foreground hover:bg-slate-100"
                        )}
                      >
                        <span className="text-lg font-semibold tracking-tight">{label}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-7 min-w-7 justify-center px-2 text-sm font-semibold tabular-nums",
                            statusTab === key ? "bg-white/80 text-primary" : "bg-white text-muted-foreground"
                          )}
                        >
                          {n}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </aside>
  
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {showTicketList ? (
                    <div className="flex min-h-0 flex-1 flex-col border-b border-border/50 bg-white">
                      <div className="border-b border-border/50 p-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search ID, title, requester…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 rounded-lg border-border/50 bg-slate-50 pl-9 text-sm focus:bg-white"
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                            <SelectTrigger size="sm" className="h-8 w-[140px] rounded-lg text-xs">
                              <ListOrdered className="mr-1 h-3.5 w-3.5" />
                              <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="updated">Last updated</SelectItem>
                              <SelectItem value="oldest">Oldest first</SelectItem>
                              <SelectItem value="priority">Priority</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant={quickToday ? "default" : "outline"}
                            size="sm"
                            className="h-8 rounded-lg gap-1 text-xs"
                            onClick={() => setQuickToday((v) => !v)}
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            Today
                          </Button>
                        </div>
                      </div>
  
                      <ScrollArea className="min-h-0 flex-1">
                        <div className="space-y-1 p-2">
                          {statusCounts.all === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                              No tickets in <span className="font-medium text-foreground">{staffCategory}</span>.
                            </div>
                          ) : filteredTickets.length === 0 ? (
                            <div className="flex flex-col items-center py-14 text-center">
                              <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/30" />
                              <p className="text-sm font-medium text-foreground">No tickets</p>
                              <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">Try another status or clear filters.</p>
                              <Button variant="link" className="mt-2 h-auto p-0 text-xs" onClick={() => { setSearchQuery(""); setQuickToday(false); setStatusTab("all") }}>
                                Reset filters
                              </Button>
                            </div>
                          ) : (
                            filteredTickets.map((ticket) => {
                              const CategoryIcon = categoryIcons[ticket.category] ?? MessageSquare
                              const active = selectedId === ticket.id
                              return (
                                <button
                                  key={ticket.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedId(ticket.id)
                                    setShowTicketList(false)
                                  }}
                                  className={cn(
                                    "w-full rounded-xl border p-3 text-left transition-all",
                                    active
                                      ? "border-primary/25 bg-gradient-to-r from-primary/8 to-accent/5 shadow-sm"
                                      : "border-transparent hover:bg-slate-50"
                                  )}
                                >
                                  <div className="mb-2 flex items-start gap-2">
                                    <div
                                      className={cn(
                                        "w-1 self-stretch rounded-full",
                                        ticket.priority <= 2 ? "bg-red-500" : ticket.priority === 3 ? "bg-amber-400" : "bg-slate-200"
                                      )}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "h-[18px] px-1.5 text-[10px] font-semibold",
                                            priorityConfig[ticket.priority].className
                                          )}
                                        >
                                          {priorityConfig[ticket.priority].label}
                                        </Badge>
                                        <span className="text-[10px] font-medium text-muted-foreground">#{ticket.id}</span>
                                        {ticket.assignedTo === null && (
                                          <Badge variant="secondary" className="h-[18px] border-0 bg-amber-100 text-[10px] text-amber-900">
                                            Unassigned
                                          </Badge>
                                        )}
                                      </div>
                                      <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">{ticket.title}</h3>
                                    </div>
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-muted-foreground">
                                      <CategoryIcon className="h-4 w-4" />
                                    </div>
                                  </div>
                                  <div className="mb-1.5 flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[8px]">{ticket.requester.initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-[11px] text-muted-foreground">{ticket.requester.name}</span>
                                    {ticket.unreadCount > 0 && (
                                      <Badge className="ml-auto h-5 min-w-5 justify-center px-1 text-[10px]">{ticket.unreadCount}</Badge>
                                    )}
                                  </div>
                                  <p className="line-clamp-1 text-[11px] text-muted-foreground">{ticket.lastMessage}</p>
                                  <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{ticket.lastMessageTime}</span>
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : selectedTicket ? (
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-50/30 to-white">
                      <div className="flex shrink-0 items-center border-b border-border/50 bg-white px-4 py-2 lg:px-8">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-lg"
                          onClick={() => setShowTicketList(true)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Ticket list
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 bg-white px-6 py-3 lg:px-10">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-semibold leading-tight text-foreground">{selectedTicket.title}</h2>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            #{selectedTicket.id} · {selectedTicket.category} · {selectedTicket.channel}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedTicket.status !== "resolved" &&
                            (selectedTicket.assignedTo === null ? (
                              <Button size="sm" className="h-8 gap-1 rounded-lg" onClick={handleAssignToMe}>
                                <UserPlus className="h-3.5 w-3.5" />
                                Assign to me
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="h-8 gap-1 rounded-lg" onClick={handleRelease}>
                                <UserMinus className="h-3.5 w-3.5" />
                                Release
                              </Button>
                            ))}
                          {selectedTicket.status !== "resolved" && (
                            <Button size="sm" variant="secondary" className="h-8 gap-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleResolveTicket}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Resolve
                            </Button>
                          )}
                          {canRequesterCloseSelectedResolvedTicket && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={handleCloseTicket} className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Close ticket
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
  
                      <div className="grid gap-3 border-b border-border/50 bg-white px-6 py-3 sm:grid-cols-2 lg:px-10">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Requester</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{selectedTicket.requester.initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{selectedTicket.requester.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{selectedTicket.requester.email}</p>
                              {selectedTicket.requester.phone && (
                                <p className="text-xs text-muted-foreground">{selectedTicket.requester.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Created</p>
                            <p className="mt-1 font-medium text-foreground">
                              {new Date(selectedTicket.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Updated</p>
                            <p className="mt-1 font-medium text-foreground">
                              {new Date(selectedTicket.updatedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Assignment</p>
                            <p className="mt-1 font-medium text-foreground">
                              {selectedTicket.assignedTo === "me" ? "You" : "Team queue"}
                            </p>
                          </div>
                        </div>
                      </div>
  
                      <div className="flex min-h-0 flex-1 flex-col">
                        <ScrollArea className="min-h-0 flex-1">
                          <div className="mx-auto max-w-5xl space-y-4 px-6 py-4 lg:px-10">
                            {selectedConversation.map((message) => (
                              <div key={message.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback
                                    className={cn(
                                      "text-[10px] font-semibold",
                                      message.role === "assistant"
                                        ? "bg-gradient-to-br from-primary to-accent text-white"
                                        : message.role === "agent"
                                          ? "bg-emerald-500 text-white"
                                          : "bg-slate-100 text-slate-700"
                                    )}
                                  >
                                    {message.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : message.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold">{message.sender}</span>
                                    {message.role === "assistant" && (
                                      <Badge variant="secondary" className="h-4 gap-0.5 border-0 bg-primary/10 px-1.5 text-[10px] text-primary">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        AI
                                      </Badge>
                                    )}
                                    {message.role === "agent" && (
                                      <Badge variant="secondary" className="h-4 border-0 bg-emerald-50 px-1.5 text-[10px] text-emerald-700">
                                        Agent
                                      </Badge>
                                    )}
                                    <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
                                  </div>
                                  <div
                                    className={cn(
                                      "rounded-xl border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                                      message.role === "user"
                                        ? "border-border/60 bg-white"
                                        : message.role === "assistant"
                                          ? "border-primary/15 bg-primary/5"
                                          : "border-emerald-100 bg-emerald-50/50"
                                    )}
                                  >
                                    {message.content}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        {selectedTicket.status !== "resolved" && (
                          <div className="border-t border-border/50 bg-white px-6 py-4 lg:px-10">
                            <div className="mx-auto max-w-5xl">
                              {attachedFiles.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                  {attachedFiles.map((file, index) => (
                                    <div
                                      key={`${file.name}-${index}`}
                                      className="flex items-center gap-2 rounded-lg border border-border/50 bg-slate-50 px-2.5 py-1.5 text-[11px]"
                                    >
                                      <span className="max-w-[220px] truncate text-foreground">{file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeAttachedFile(index)}
                                        className="rounded-full p-0.5 text-muted-foreground hover:bg-slate-200"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Input
                                  placeholder="Type your reply…"
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  className="h-10 flex-1 rounded-lg border-border/50 bg-slate-50 focus:bg-white"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      handleSendMessage()
                                    }
                                  }}
                                />
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  multiple
                                  className="hidden"
                                  accept="image/*,.pdf,.doc,.docx,.txt,.log,.mp3,.wav,.m4a"
                                  onChange={handleFileChange}
                                />
                                <div className="flex shrink-0 items-center gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-lg"
                                    onClick={handleVoiceRecord}
                                  >
                                    <Mic className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    className="h-10 gap-2 rounded-lg px-6"
                                    onClick={() => handleSendMessage()}
                                    disabled={!newMessage.trim() && attachedFiles.length === 0}
                                  >
                                    <Send className="h-4 w-4" />
                                    Send
                                  </Button>
                                  <p className="text-[10px] text-muted-foreground">Enter to send</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedPage>
  )
}