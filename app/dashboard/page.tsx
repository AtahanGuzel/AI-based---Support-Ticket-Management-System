"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { KanbanBoard, type KanbanTicket } from "@/components/kanban-board"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, SlidersHorizontal, Ticket, Clock, CheckCircle2, AlertTriangle } from "lucide-react"

const mockTickets: KanbanTicket[] = [
  {
    id: "TK-1234",
    title: "Email sync not working on mobile devices after iOS update",
    priority: 2,
    status: "in-progress",
    category: "Email",
    assignee: { name: "Sarah Chen", initials: "SC" },
    createdAt: "2h ago",
    tags: ["iOS", "Mobile"],
    slaTime: "2h 30m",
  },
  {
    id: "TK-1242",
    title: "Email sync not working on mobile devices after iOS update",
    priority: 2,
    status: "in-progress",
    category: "Email",
    assignee: { name: "Sarah Chen", initials: "SC" },
    createdAt: "1h ago",
    tags: ["Android", "Mobile"],
    slaTime: "3h",
  },
  {
    id: "TK-1235",
    title: "Request for new 27-inch monitor for design team",
    priority: 4,
    status: "open",
    category: "Hardware",
    createdAt: "4h ago",
    tags: ["Equipment"],
    slaTime: "24h",
  },
  {
    id: "TK-1236",
    title: "VPN disconnects frequently when switching networks",
    priority: 3,
    status: "open",
    category: "Network",
    createdAt: "6h ago",
    tags: ["VPN", "Critical"],
    slaTime: "8h",
  },
  {
    id: "TK-1237",
    title: "Software license renewal for Adobe Creative Suite",
    priority: 3,
    status: "in-progress",
    category: "Software",
    assignee: { name: "Emily Davis", initials: "ED" },
    createdAt: "1d ago",
    tags: ["License"],
    slaTime: "12h",
  },
  {
    id: "TK-1238",
    title: "Printer not connecting to network after office move",
    priority: 2,
    status: "open",
    category: "Hardware",
    createdAt: "1d ago",
    tags: ["Printer", "Network"],
    slaTime: "4h",
  },
  {
    id: "TK-1239",
    title: "Password reset request for legacy system access",
    priority: 5,
    status: "resolved",
    category: "Access",
    assignee: { name: "John Doe", initials: "JD" },
    createdAt: "2d ago",
    tags: ["Password"],
    slaTime: "Completed",
  },
  {
    id: "TK-1240",
    title: "Laptop running slow - possible malware infection",
    priority: 1,
    status: "in-progress",
    category: "Security",
    assignee: { name: "Alex Wong", initials: "AW" },
    createdAt: "3h ago",
    tags: ["Urgent", "Security"],
    slaTime: "1h",
  },
  {
    id: "TK-1241",
    title: "Zoom video quality issues during meetings",
    priority: 4,
    status: "resolved",
    category: "Software",
    assignee: { name: "Sarah Chen", initials: "SC" },
    createdAt: "3d ago",
    tags: ["Video", "Conference"],
    slaTime: "Completed",
  },
]

const categories = ["All", "Email", "Hardware", "Network", "Software", "Security", "Access"]
const priorities = ["All", "P1", "P2", "P3", "P4", "P5"]

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")

  const filteredTickets = mockTickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || ticket.category === selectedCategory
    const matchesPriority = selectedPriority === "All" || 
      `P${ticket.priority}` === selectedPriority
    return matchesSearch && matchesCategory && matchesPriority
  })

  const stats = {
    total: mockTickets.length,
    open: mockTickets.filter((t) => t.status === "open").length,
    inProgress: mockTickets.filter((t) => t.status === "in-progress").length,
    resolved: mockTickets.filter((t) => t.status === "resolved").length,
    urgent: mockTickets.filter((t) => t.priority <= 2 && t.status !== "resolved").length,
  }

  return (
    <ProtectedPage allowedRoles={["agent", "admin"]}>
      <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        {/* Header */}
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Ticket Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage and track all support tickets</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
                  <Ticket className="h-5 w-5 text-slate-600" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground bg-slate-50 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">All tickets</p>
            </div>
            
            <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex h-3 w-3 rounded-full bg-primary animate-pulse" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.open}</p>
              <p className="text-sm text-muted-foreground mt-1">Open tickets</p>
            </div>
            
            <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground mt-1">In progress</p>
            </div>
            
            <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Today</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.resolved}</p>
              <p className="text-sm text-muted-foreground mt-1">Resolved</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets by ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 rounded-xl border-border/50 bg-white shadow-sm focus:shadow-md focus:border-primary/50 transition-all"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-11 rounded-xl border-border/50 bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                  <Filter className="h-4 w-4" />
                  Category
                  {selectedCategory !== "All" && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">{selectedCategory}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategory === category}
                    onCheckedChange={() => setSelectedCategory(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-11 rounded-xl border-border/50 bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                  <SlidersHorizontal className="h-4 w-4" />
                  Priority
                  {selectedPriority !== "All" && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">{selectedPriority}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {priorities.map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority}
                    checked={selectedPriority === priority}
                    onCheckedChange={() => setSelectedPriority(priority)}
                  >
                    {priority}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Kanban Board */}
          <KanbanBoard tickets={filteredTickets} />
        </div>
      </main>
      </div>
    </ProtectedPage>
  )
}
