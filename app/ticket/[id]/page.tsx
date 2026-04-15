"use client"

import { use } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
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
  FileText
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

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

// Mock ticket data
const getTicketData = (id: string) => ({
  id,
  title: "Email sync not working on mobile devices after iOS update",
  description: "After updating to iOS 17.4, the email application no longer syncs properly. Messages appear on desktop but not on mobile, and sending emails from mobile results in them being stuck in outbox.",
  priority: 2 as const,
  status: "in-progress" as const,
  category: "Email",
  assignee: { name: "Sarah Chen", initials: "SC", email: "sarah@company.com" },
  requester: { name: "John Doe", initials: "JD", email: "john@company.com" },
  createdAt: "April 15, 2026 at 10:30 AM",
  updatedAt: "April 15, 2026 at 2:45 PM",
  slaDeadline: "April 15, 2026 at 6:30 PM",
  department: "Engineering",
  systemInfo: {
    os: "iOS 17.4",
    browser: "Mail App 4.2.1",
    device: "iPhone 15 Pro",
  },
  aiSummary: "User experiencing email sync issues post-iOS update. Likely cause: OAuth token refresh failure or Exchange ActiveSync protocol mismatch. Recommended actions: Clear app cache, re-authenticate account, or contact Exchange admin for ActiveSync policy review.",
  conversation: [
    {
      id: "1",
      role: "user" as const,
      sender: "John Doe",
      initials: "JD",
      content: "My email stopped syncing on my iPhone after the latest iOS update. I can see emails on my laptop but they don't appear on my phone.",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      role: "assistant" as const,
      sender: "AI Assistant",
      initials: "AI",
      content: "I understand you're having email sync issues on your iPhone. Let me analyze this for you.\n\nBased on similar cases, this could be related to:\n1. OAuth token expiration after iOS update\n2. Exchange ActiveSync protocol changes\n3. Certificate validation issues\n\nCould you try removing and re-adding your email account?",
      timestamp: "10:31 AM",
    },
    {
      id: "3",
      role: "user" as const,
      sender: "John Doe",
      initials: "JD",
      content: "I tried that but it didn't work. The account gets stuck at 'Verifying' when I try to add it back.",
      timestamp: "10:45 AM",
    },
    {
      id: "4",
      role: "agent" as const,
      sender: "Sarah Chen",
      initials: "SC",
      content: "Hi John, I'm Sarah from the IT team. I've looked into your issue and it seems to be affecting several users after the iOS 17.4 update.\n\nOur Exchange admin is rolling out a fix. In the meantime, you can use the Outlook app as a workaround - it's not affected by this issue.\n\nI'll keep you updated on the permanent fix.",
      timestamp: "2:45 PM",
    },
  ],
  activityLog: [
    { action: "Ticket created by AI", timestamp: "10:30 AM", icon: Sparkles },
    { action: "Priority set to P2", timestamp: "10:30 AM", icon: Activity },
    { action: "Assigned to Sarah Chen", timestamp: "10:32 AM", icon: UserPlus },
    { action: "Status changed to In Progress", timestamp: "2:45 PM", icon: Clock },
    { action: "Response sent to requester", timestamp: "2:45 PM", icon: Send },
  ],
})

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const ticket = getTicketData(id)
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      toast.success("Message sent", { description: "Your reply has been sent to the requester." })
      setNewMessage("")
    }
  }

  const handleAssignToMe = () => {
    toast.success("Ticket assigned", { description: "This ticket has been assigned to you." })
  }

  const handleResolve = () => {
    toast.success("Ticket resolved", { description: "This ticket has been marked as resolved." })
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        {/* Header */}
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Ticket #{ticket.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all" onClick={handleAssignToMe}>
              <UserPlus className="h-4 w-4" />
              Assign to me
            </Button>
            <Button className="gap-2 rounded-xl btn-primary-gradient" onClick={handleResolve}>
              <CheckCircle2 className="h-4 w-4" />
              Mark as Resolved
            </Button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary - Premium Highlight */}
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

              {/* Ticket Details */}
              <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs font-semibold border", priorityConfig[ticket.priority].className)}>
                        {priorityConfig[ticket.priority].label}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-xs font-medium border-0", statusConfig[ticket.status].className)}>
                        {statusConfig[ticket.status].label}
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
                  <div className="flex gap-3">
                    <Input
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="rounded-xl border-border/50 bg-white shadow-sm focus:shadow-md focus:border-primary/50 transition-all"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="gap-2 rounded-xl btn-primary-gradient shrink-0">
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
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
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">SLA Deadline</p>
                      <p className="text-sm text-amber-700 font-medium truncate">{ticket.slaDeadline}</p>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
