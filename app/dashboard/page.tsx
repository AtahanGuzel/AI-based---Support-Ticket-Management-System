"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, Clock, AlertCircle, CheckCircle2, Inbox, Zap } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { api, type BackendTicket, normalizeStatus, deptToCategory, relativeTime } from "@/lib/api"
import { cn } from "@/lib/utils"

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: "P1", className: "priority-p1" },
  2: { label: "P2", className: "priority-p2" },
  3: { label: "P3", className: "priority-p3" },
  4: { label: "P4", className: "priority-p4" },
  5: { label: "P5", className: "priority-p5" },
}

function getPriorityCfg(p: number) {
  return priorityConfig[Math.min(p, 5)] ?? priorityConfig[5]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700 border-blue-200" },
  "in-progress": { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", className: "bg-slate-50 text-slate-600 border-slate-200" },
}

const categories = ["All", "IT & Hardware", "DevOps & Software", "Financial Operations", "HR & Admin", "Other"]
const priorities = ["All", "P1", "P2", "P3", "P4", "P5"]

interface UITicket {
  id: string
  title: string
  priority: number
  status: string
  category: string
  createdAt: string
}

function toUITicket(t: BackendTicket): UITicket {
  return {
    id: `TK-${t.ticket_id}`,
    title: t.description,
    priority: Math.min(t.priority, 5),
    status: normalizeStatus(t.status),
    category: deptToCategory(t.department_id),
    createdAt: relativeTime(t.created_at),
  }
}

function DashboardContent() {
  const [tickets, setTickets] = useState<UITicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")

  useEffect(() => {
    api
      .getAllTickets()
      .then((data) => setTickets(data.map(toUITicket)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || ticket.category === selectedCategory
    const matchesPriority = selectedPriority === "All" || `P${ticket.priority}` === selectedPriority
    return matchesSearch && matchesCategory && matchesPriority
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    urgent: tickets.filter((t) => t.priority <= 2 && t.status !== "resolved").length,
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        {/* Header */}
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Ticket Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage and track all support tickets</p>
          </div>
          <Button className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-5">
            {[
              { label: "Total Tickets", value: stats.total, icon: Inbox, color: "text-primary" },
              { label: "Open", value: stats.open, icon: Clock, color: "text-blue-600" },
              { label: "In Progress", value: stats.inProgress, icon: Zap, color: "text-amber-600" },
              { label: "Urgent", value: stats.urgent, icon: AlertCircle, color: "text-red-600" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Category: {selectedCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={selectedCategory === c}
                    onCheckedChange={() => setSelectedCategory(c)}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Priority: {selectedPriority}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {priorities.map((p) => (
                  <DropdownMenuCheckboxItem
                    key={p}
                    checked={selectedPriority === p}
                    onCheckedChange={() => setSelectedPriority(p)}
                  >
                    {p}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Ticket list */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No tickets found.</div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const pCfg = getPriorityCfg(ticket.priority)
                const sCfg = statusConfig[ticket.status] ?? statusConfig["open"]
                return (
                  <Card key={ticket.id} className="border-border/50 hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-[18px] font-semibold border",
                                pCfg.className
                              )}
                            >
                              {pCfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ticket.category}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            className={cn(
                              "text-[10px] px-2 py-0.5 h-5 font-medium border-0",
                              sCfg.className
                            )}
                          >
                            {sCfg.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{ticket.createdAt}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedPage allowedRoles={["agent", "admin"]}>
      <DashboardContent />
    </ProtectedPage>
  )
}
