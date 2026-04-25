"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { dashboardMockTickets, ticketCategories, ticketPriorities } from "@/lib/dashboard-tickets"
import { Search, Filter, SlidersHorizontal } from "lucide-react"

export default function AllTicketsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")

  const filteredTickets = useMemo(
    () =>
      dashboardMockTickets.filter((ticket) => {
        const matchesSearch =
          ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "All" || ticket.category === selectedCategory
        const matchesPriority = selectedPriority === "All" || `P${ticket.priority}` === selectedPriority
        return matchesSearch && matchesCategory && matchesPriority
      }),
    [searchQuery, selectedCategory, selectedPriority]
  )

  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64">
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-white/80 px-8 backdrop-blur-xl">
            <div>
              <h1 className="text-lg font-semibold text-foreground">All Tickets</h1>
              <p className="text-sm text-muted-foreground">Complete ticket list for admin operations</p>
            </div>
            <Badge variant="secondary">{filteredTickets.length} shown</Badge>
          </div>

          <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by ID or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-xl border-border/50 bg-white pl-11 shadow-sm focus:border-primary/50"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 gap-2 rounded-xl border-border/50 bg-white shadow-sm">
                    <Filter className="h-4 w-4" />
                    Category
                    {selectedCategory !== "All" && (
                      <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{selectedCategory}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ticketCategories.map((category) => (
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
                  <Button variant="outline" className="h-11 gap-2 rounded-xl border-border/50 bg-white shadow-sm">
                    <SlidersHorizontal className="h-4 w-4" />
                    Priority
                    {selectedPriority !== "All" && (
                      <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{selectedPriority}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ticketPriorities.map((priority) => (
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

            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/ticket/${ticket.id}`}
                  className="block rounded-2xl border border-border/50 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">#{ticket.id}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{ticket.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.category} · {ticket.createdAt}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">P{ticket.priority}</Badge>
                      <Badge variant="secondary" className="capitalize">
                        {ticket.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}
