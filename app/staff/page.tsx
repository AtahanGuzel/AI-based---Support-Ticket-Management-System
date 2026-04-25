"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Email: Mail,
  Network: Wifi,
  Security: Shield,
  Software: Monitor,
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

const mockTicketsSeed: StaffTicket[] = [
  {
    id: "TK-1234",
    title: "Email sync not working on mobile",
    priority: 2,
    status: "in-progress",
    category: "Email",
    assignedTo: "me",
    requester: { name: "John Doe", initials: "JD", email: "john@company.com", phone: "+1 415 *** **90" },
    channel: "email",
    createdAt: "2026-04-24T08:30:00",
    updatedAt: "2026-04-24T10:45:00",
    isNewToday: true,
    lastMessage: "I tried that but it didn't work. The account gets stuck at Verifying.",
    lastMessageTime: "10 min ago",
    unreadCount: 2,
    conversation: [
      { id: "1", role: "user", sender: "John Doe", initials: "JD", content: "My email stopped syncing on my iPhone.", timestamp: "10:30 AM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "Could you try removing and re-adding your email account?", timestamp: "10:31 AM" },
      { id: "3", role: "user", sender: "John Doe", initials: "JD", content: "I tried that but it didn't work. The account gets stuck at Verifying.", timestamp: "10:45 AM" },
    ],
    activity: [
      { id: "a1", text: "Ticket created from email", time: "08:30" },
      { id: "a2", text: "Assigned to you", time: "09:05" },
      { id: "a3", text: "Status → In progress", time: "09:06" },
    ],
  },
  {
    id: "TK-1240",
    title: "Laptop running slow - possible malware",
    priority: 1,
    status: "in-progress",
    category: "Security",
    assignedTo: "me",
    requester: { name: "Lisa Park", initials: "LP", email: "lisa@company.com" },
    channel: "web",
    createdAt: "2026-04-24T14:15:00",
    updatedAt: "2026-04-24T14:20:00",
    isNewToday: true,
    lastMessage: "I've noticed some suspicious pop-ups and the laptop is very slow.",
    lastMessageTime: "5 min ago",
    unreadCount: 1,
    conversation: [
      { id: "1", role: "user", sender: "Lisa Park", initials: "LP", content: "My laptop has been running very slow lately and I see weird pop-ups.", timestamp: "2:15 PM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "This sounds like it could be malware. Please disconnect from the network immediately.", timestamp: "2:15 PM" },
      { id: "3", role: "user", sender: "Lisa Park", initials: "LP", content: "I've noticed some suspicious pop-ups and the laptop is very slow.", timestamp: "2:20 PM" },
    ],
    activity: [
      { id: "a1", text: "Priority escalated to P1", time: "14:16" },
      { id: "a2", text: "Assigned to you", time: "14:17" },
    ],
  },
  {
    id: "TK-1237",
    title: "Adobe Creative Suite license renewal",
    priority: 3,
    status: "in-progress",
    category: "Software",
    assignedTo: "me",
    requester: { name: "Mike Wilson", initials: "MW", email: "mike@company.com" },
    channel: "chat",
    createdAt: "2026-04-23T09:00:00",
    updatedAt: "2026-04-24T12:30:00",
    isNewToday: false,
    lastMessage: "When will the new licenses be available?",
    lastMessageTime: "1h ago",
    unreadCount: 0,
    conversation: [
      { id: "1", role: "user", sender: "Mike Wilson", initials: "MW", content: "The design team needs Adobe Creative Suite licenses renewed.", timestamp: "9:00 AM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "I'll create a ticket for license renewal. How many seats do you need?", timestamp: "9:01 AM" },
      { id: "3", role: "user", sender: "Mike Wilson", initials: "MW", content: "We need 5 seats for the design team.", timestamp: "9:15 AM" },
      { id: "4", role: "agent", sender: "You", initials: "AG", content: "I've submitted the request for 5 Adobe CC licenses. Should be ready within 24 hours.", timestamp: "11:30 AM" },
      { id: "5", role: "user", sender: "Mike Wilson", initials: "MW", content: "When will the new licenses be available?", timestamp: "12:30 PM" },
    ],
    activity: [
      { id: "a1", text: "Assigned to you", time: "Apr 23, 10:12" },
      { id: "a2", text: "Internal note added", time: "Apr 24, 11:30" },
    ],
  },
  {
    id: "TK-1252",
    title: "Design tool crash on export — pending customer logs",
    priority: 4,
    status: "in-progress",
    category: "Software",
    assignedTo: "me",
    requester: { name: "Nina Kaya", initials: "NK", email: "nina@company.com" },
    channel: "email",
    createdAt: "2026-04-22T11:00:00",
    updatedAt: "2026-04-24T09:00:00",
    isNewToday: false,
    lastMessage: "I'll send the crash log tonight after my meeting.",
    lastMessageTime: "3h ago",
    unreadCount: 0,
    conversation: [
      { id: "1", role: "user", sender: "Nina Kaya", initials: "NK", content: "Figma export crashes on large files.", timestamp: "Apr 22" },
      { id: "2", role: "agent", sender: "You", initials: "AG", content: "Could you attach the crash log from Help → Diagnostics?", timestamp: "Apr 23" },
      { id: "3", role: "user", sender: "Nina Kaya", initials: "NK", content: "I'll send the crash log tonight after my meeting.", timestamp: "Apr 24" },
    ],
    activity: [
      { id: "a1", text: "Pending customer logs", time: "Apr 24, 09:00" },
    ],
  },
  {
    id: "TK-1242",
    title: "VPN connection timeout issues",
    priority: 3,
    status: "open",
    category: "Network",
    assignedTo: null,
    requester: { name: "Emma Brown", initials: "EB", email: "emma@company.com" },
    channel: "web",
    createdAt: "2026-04-24T13:00:00",
    updatedAt: "2026-04-24T13:05:00",
    isNewToday: true,
    lastMessage: "VPN keeps disconnecting every few minutes.",
    lastMessageTime: "30 min ago",
    unreadCount: 3,
    conversation: [
      { id: "1", role: "user", sender: "Emma Brown", initials: "EB", content: "My VPN keeps disconnecting every few minutes. This is affecting my work.", timestamp: "1:00 PM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "VPN issues can be frustrating. Are you on WiFi or ethernet?", timestamp: "1:01 PM" },
      { id: "3", role: "user", sender: "Emma Brown", initials: "EB", content: "I'm on WiFi. The connection seems stable otherwise.", timestamp: "1:05 PM" },
    ],
    activity: [
      { id: "a1", text: "Routed to Network queue", time: "13:00" },
    ],
  },
  {
    id: "TK-1255",
    title: "Shared mailbox permissions reset request",
    priority: 4,
    status: "open",
    category: "Email",
    assignedTo: null,
    requester: { name: "Omar Celik", initials: "OC", email: "omar@company.com" },
    channel: "email",
    createdAt: "2026-04-24T11:20:00",
    updatedAt: "2026-04-24T11:22:00",
    isNewToday: true,
    lastMessage: "Our team lost access to support@ after the migration.",
    lastMessageTime: "2h ago",
    unreadCount: 0,
    conversation: [
      { id: "1", role: "user", sender: "Omar Celik", initials: "OC", content: "Our team lost access to support@ after the migration.", timestamp: "11:20 AM" },
    ],
    activity: [{ id: "a1", text: "Unassigned in Email queue", time: "11:20" }],
  },
  {
    id: "TK-1188",
    title: "Printer driver rollback",
    priority: 5,
    status: "resolved",
    category: "Software",
    assignedTo: "me",
    requester: { name: "Can Yurt", initials: "CY", email: "can@company.com" },
    channel: "web",
    createdAt: "2026-04-10T10:00:00",
    updatedAt: "2026-04-12T16:00:00",
    isNewToday: false,
    lastMessage: "Thanks, printing works again.",
    lastMessageTime: "Apr 12",
    unreadCount: 0,
    conversation: [
      { id: "1", role: "user", sender: "Can Yurt", initials: "CY", content: "Driver update broke printing.", timestamp: "Apr 10" },
      { id: "2", role: "agent", sender: "You", initials: "AG", content: "Rolled back to v2.4.1 on your machine.", timestamp: "Apr 12" },
      { id: "3", role: "user", sender: "Can Yurt", initials: "CY", content: "Thanks, printing works again.", timestamp: "Apr 12" },
    ],
    activity: [
      { id: "a1", text: "Status → Resolved", time: "Apr 12, 16:00" },
    ],
  },
]

export default function StaffPanelPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<StaffTicket[]>(mockTicketsSeed)
  const staffCategory: SupportCategory = (user?.supportCategory ?? "Software") as SupportCategory
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const handleSendMessage = () => {
    if ((!newMessage.trim() && attachedFiles.length === 0) || !selectedTicket) return
    if (selectedTicket.status === "resolved") return

    const body = newMessage.trim()
    const attachmentSummary =
      attachedFiles.length > 0
        ? `\n\n[Attachments: ${attachedFiles.map((file) => file.name).join(", ")}]`
        : ""
    const newConversation: TicketConversation = {
      id: crypto.randomUUID(),
      role: "agent",
      sender: agentName,
      initials: agentInitials,
      content: `${body}${attachmentSummary}`.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              conversation: [...t.conversation, newConversation],
              unreadCount: 0,
              lastMessage: body || `Sent ${attachedFiles.length} attachment(s)`,
              lastMessageTime: "Just now",
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )

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

  const handleResolveTicket = () => {
    if (!selectedTicket) return
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
                        <Button variant="link" className="mt-2 h-auto p-0 text-xs" onClick={() => { setSearchQuery(""); setQuickToday(false); setStatusTab("all"); }}>
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
                        {selectedTicket.conversation.map((message) => (
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
        </main>
      </div>
    </ProtectedPage>
  )
}
