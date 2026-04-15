"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
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
  "Email": Mail,
  "Network": Wifi,
  "Security": Shield,
  "Software": Monitor,
}

interface TicketConversation {
  id: string
  role: "user" | "assistant" | "agent"
  sender: string
  initials: string
  content: string
  timestamp: string
}

interface StaffTicket {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  status: "open" | "in-progress" | "resolved"
  category: string
  requester: {
    name: string
    initials: string
    email: string
  }
  slaTime: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  conversation: TicketConversation[]
}

const mockAssignedTickets: StaffTicket[] = [
  {
    id: "TK-1234",
    title: "Email sync not working on mobile",
    priority: 2,
    status: "in-progress",
    category: "Email",
    requester: { name: "John Doe", initials: "JD", email: "john@company.com" },
    slaTime: "2h 30m",
    lastMessage: "I tried that but it didn't work. The account gets stuck at Verifying.",
    lastMessageTime: "10 min ago",
    unreadCount: 2,
    conversation: [
      { id: "1", role: "user", sender: "John Doe", initials: "JD", content: "My email stopped syncing on my iPhone.", timestamp: "10:30 AM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "Could you try removing and re-adding your email account?", timestamp: "10:31 AM" },
      { id: "3", role: "user", sender: "John Doe", initials: "JD", content: "I tried that but it didn't work. The account gets stuck at Verifying.", timestamp: "10:45 AM" },
    ],
  },
  {
    id: "TK-1240",
    title: "Laptop running slow - possible malware",
    priority: 1,
    status: "in-progress",
    category: "Security",
    requester: { name: "Lisa Park", initials: "LP", email: "lisa@company.com" },
    slaTime: "45m",
    lastMessage: "I've noticed some suspicious pop-ups and the laptop is very slow.",
    lastMessageTime: "5 min ago",
    unreadCount: 1,
    conversation: [
      { id: "1", role: "user", sender: "Lisa Park", initials: "LP", content: "My laptop has been running very slow lately and I see weird pop-ups.", timestamp: "2:15 PM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "This sounds like it could be malware. Please disconnect from the network immediately.", timestamp: "2:15 PM" },
      { id: "3", role: "user", sender: "Lisa Park", initials: "LP", content: "I've noticed some suspicious pop-ups and the laptop is very slow.", timestamp: "2:20 PM" },
    ],
  },
  {
    id: "TK-1237",
    title: "Adobe Creative Suite license renewal",
    priority: 3,
    status: "in-progress",
    category: "Software",
    requester: { name: "Mike Wilson", initials: "MW", email: "mike@company.com" },
    slaTime: "12h",
    lastMessage: "When will the new licenses be available?",
    lastMessageTime: "1h ago",
    unreadCount: 0,
    conversation: [
      { id: "1", role: "user", sender: "Mike Wilson", initials: "MW", content: "The design team needs Adobe Creative Suite licenses renewed.", timestamp: "9:00 AM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "I'll create a ticket for license renewal. How many seats do you need?", timestamp: "9:01 AM" },
      { id: "3", role: "user", sender: "Mike Wilson", initials: "MW", content: "We need 5 seats for the design team.", timestamp: "9:15 AM" },
      { id: "4", role: "agent", sender: "You", initials: "SC", content: "I've submitted the request for 5 Adobe CC licenses. Should be ready within 24 hours.", timestamp: "11:30 AM" },
      { id: "5", role: "user", sender: "Mike Wilson", initials: "MW", content: "When will the new licenses be available?", timestamp: "12:30 PM" },
    ],
  },
  {
    id: "TK-1242",
    title: "VPN connection timeout issues",
    priority: 3,
    status: "open",
    category: "Network",
    requester: { name: "Emma Brown", initials: "EB", email: "emma@company.com" },
    slaTime: "6h",
    lastMessage: "VPN keeps disconnecting every few minutes.",
    lastMessageTime: "30 min ago",
    unreadCount: 3,
    conversation: [
      { id: "1", role: "user", sender: "Emma Brown", initials: "EB", content: "My VPN keeps disconnecting every few minutes. This is affecting my work.", timestamp: "1:00 PM" },
      { id: "2", role: "assistant", sender: "AI Assistant", initials: "AI", content: "VPN issues can be frustrating. Are you on WiFi or ethernet?", timestamp: "1:01 PM" },
      { id: "3", role: "user", sender: "Emma Brown", initials: "EB", content: "I'm on WiFi. The connection seems stable otherwise.", timestamp: "1:05 PM" },
    ],
  },
]

export default function StaffPanelPage() {
  const [tickets, setTickets] = useState(mockAssignedTickets)
  const [selectedTicket, setSelectedTicket] = useState<StaffTicket | null>(mockAssignedTickets[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("assigned")

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.requester.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "assigned") {
      return matchesSearch && ticket.status !== "resolved"
    } else {
      return matchesSearch && ticket.status === "resolved"
    }
  })

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return

    const newConversation: TicketConversation = {
      id: Date.now().toString(),
      role: "agent",
      sender: "You",
      initials: "SC",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, conversation: [...t.conversation, newConversation], unreadCount: 0 }
          : t
      )
    )

    setSelectedTicket((prev) =>
      prev ? { ...prev, conversation: [...prev.conversation, newConversation], unreadCount: 0 } : null
    )

    setNewMessage("")
    toast.success("Message sent")
  }

  const handleResolveTicket = () => {
    if (!selectedTicket) return

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id ? { ...t, status: "resolved" as const } : t
      )
    )

    setSelectedTicket((prev) => (prev ? { ...prev, status: "resolved" as const } : null))
    toast.success("Ticket resolved", { description: `Ticket ${selectedTicket.id} has been marked as resolved.` })
  }

  const handleCloseTicket = () => {
    if (!selectedTicket) return
    
    setTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id))
    setSelectedTicket(filteredTickets.find((t) => t.id !== selectedTicket.id) || null)
    toast.success("Ticket closed", { description: "The ticket has been closed and archived." })
  }

  const stats = {
    assigned: tickets.filter((t) => t.status !== "resolved").length,
    urgent: tickets.filter((t) => t.priority <= 2 && t.status !== "resolved").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
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
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned</p>
                <p className="text-sm font-semibold text-foreground">{stats.assigned}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <Clock className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className="text-sm font-semibold text-red-600">{stats.urgent}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resolved</p>
                <p className="text-sm font-semibold text-emerald-600">{stats.resolved}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-4rem)]">
          {/* Ticket List */}
          <div className="w-[380px] border-r border-border/50 flex flex-col bg-white">
            {/* Search */}
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 rounded-xl border-border/50 bg-slate-50 focus:bg-white shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4 pt-3">
                <TabsList className="w-full bg-slate-50 p-1 rounded-xl">
                  <TabsTrigger value="assigned" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Active ({tickets.filter((t) => t.status !== "resolved").length})
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Resolved ({tickets.filter((t) => t.status === "resolved").length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="assigned" className="flex-1 m-0">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {filteredTickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 mb-4">
                          <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No tickets found</p>
                        <p className="text-xs text-muted-foreground">Tickets will appear here</p>
                      </div>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const CategoryIcon = categoryIcons[ticket.category] || MessageSquare
                        return (
                          <button
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={cn(
                              "w-full text-left p-4 rounded-xl transition-all duration-200",
                              selectedTicket?.id === ticket.id
                                ? "bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 shadow-sm"
                                : "hover:bg-slate-50 border border-transparent"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                                  selectedTicket?.id === ticket.id ? "bg-primary/10 text-primary" : "bg-slate-50 text-muted-foreground"
                                )}>
                                  <CategoryIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Badge
                                      variant="outline"
                                      className={cn("text-[10px] px-1.5 py-0 h-[18px] font-semibold border", priorityConfig[ticket.priority].className)}
                                    >
                                      {priorityConfig[ticket.priority].label}
                                    </Badge>
                                    <span className="text-[11px] text-muted-foreground font-medium">#{ticket.id}</span>
                                  </div>
                                  <h3 className="text-sm font-medium text-foreground line-clamp-1">
                                    {ticket.title}
                                  </h3>
                                </div>
                              </div>
                              {ticket.unreadCount > 0 && (
                                <Badge className="h-5 min-w-5 px-1.5 bg-primary text-primary-foreground text-[10px] font-semibold shrink-0">
                                  {ticket.unreadCount}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Avatar className="h-5 w-5 ring-1 ring-white shadow-sm">
                                <AvatarFallback className="text-[8px] font-semibold bg-slate-100 text-slate-600">
                                  {ticket.requester.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{ticket.requester.name}</span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{ticket.lastMessage}</p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">{ticket.lastMessageTime}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">{ticket.slaTime}</span>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="resolved" className="flex-1 m-0">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {filteredTickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 mb-4">
                          <CheckCircle2 className="h-7 w-7 text-emerald-500/40" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No resolved tickets</p>
                        <p className="text-xs text-muted-foreground">Resolved tickets will appear here</p>
                      </div>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl transition-all duration-200",
                            selectedTicket?.id === ticket.id
                              ? "bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 shadow-sm"
                              : "hover:bg-slate-50 border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-emerald-50 text-emerald-600 font-medium border-0">
                              Resolved
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-medium">#{ticket.id}</span>
                          </div>
                          <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-2">
                            {ticket.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 ring-1 ring-white shadow-sm">
                              <AvatarFallback className="text-[8px] font-semibold bg-slate-100 text-slate-600">
                                {ticket.requester.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{ticket.requester.name}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Conversation Area */}
          {selectedTicket ? (
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50/50 to-white">
              {/* Conversation Header */}
              <div className="h-[72px] px-6 border-b border-border/50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <Avatar className="h-11 w-11 ring-2 ring-white shadow-md">
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600">
                      {selectedTicket.requester.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{selectedTicket.requester.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">#{selectedTicket.id}</span>
                      <span className="text-muted-foreground">·</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[18px] border-border/50 bg-slate-50">
                        {selectedTicket.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedTicket.status !== "resolved" && (
                    <Button
                      size="sm"
                      className="gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                      onClick={handleResolveTicket}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Resolve
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-xl border-border/50 hover:border-primary/30">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={handleCloseTicket} className="text-destructive rounded-lg">
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Ticket
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Ticket Title Bar */}
              <div className="px-6 py-4 bg-white border-b border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-semibold border", priorityConfig[selectedTicket.priority].className)}
                  >
                    {priorityConfig[selectedTicket.priority].label}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">SLA: {selectedTicket.slaTime}</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground">{selectedTicket.title}</h3>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-5">
                  {selectedTicket.conversation.map((message) => (
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
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] bg-primary/10 text-primary border-0 gap-1 font-medium">
                              <Sparkles className="h-2.5 w-2.5" />
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
                            ? "bg-white border border-border/50 shadow-sm text-foreground" 
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
              {selectedTicket.status !== "resolved" && (
                <div className="p-5 border-t border-border/50 bg-white">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="rounded-xl border-border/50 bg-slate-50 focus:bg-white shadow-sm focus:shadow-md transition-all"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="gap-2 rounded-xl btn-primary-gradient shrink-0">
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/50 to-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">Select a ticket</p>
              <p className="text-sm text-muted-foreground">Choose a ticket from the list to view the conversation</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
