"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
import { Search, Filter, SlidersHorizontal, RefreshCw } from "lucide-react"
import { apiGetAllTickets, normaliseStatus, type ApiTicket } from "@/lib/api"

const STATUS_OPTIONS = ["All", "open", "in_progress", "resolved"]
const PRIORITY_OPTIONS = ["All", "P1", "P2", "P3", "P4", "P5"]

export default function AllTicketsPage() {
  const [tickets, setTickets] = useState<ApiTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")

  const load = () => {
    setLoading(true)
    apiGetAllTickets()
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesSearch =
          ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(ticket.ticket_id).includes(searchQuery)
        const matchesStatus = selectedStatus === "All" || ticket.status === selectedStatus
        const matchesPriority = selectedPriority === "All" || `P${ticket.priority}` === selectedPriority
        return matchesSearch && matchesStatus && matchesPriority
      }),
    [tickets, searchQuery, selectedStatus, selectedPriority]
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredTickets.length} shown</Badge>
              <Button variant="outline" size="sm" onClick={load} className="gap-1.5 rounded-lg">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by ID or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-xl border-border/50 bg-white pl-11 shadow-sm"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 gap-2 rounded-xl border-border/50 bg-white shadow-sm">
                    <Filter className="h-4 w-4" />
                    Status
                    {selectedStatus !== "All" && (
                      <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{selectedStatus}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {STATUS_OPTIONS.map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s}
                      checked={selectedStatus === s}
                      onCheckedChange={() => setSelectedStatus(s)}
                    >
                      {s.replace("_", " ")}
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
                  {PRIORITY_OPTIONS.map((p) => (
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

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading tickets…</p>
            ) : (
              <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No tickets match your filters.</p>
                ) : (
                  filteredTickets.map((ticket) => (
                    <Link
                      key={ticket.ticket_id}
                      href={`/ticket/${ticket.ticket_id}`}
                      className="block rounded-2xl border border-border/50 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">#TK-{ticket.ticket_id}</p>
                          <p className="mt-1 text-sm font-medium text-foreground line-clamp-2">{ticket.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Dept #{ticket.department_id} · {new Date(ticket.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline">P{ticket.priority}</Badge>
                          <Badge variant="secondary" className="capitalize">
                            {normaliseStatus(ticket.status).replace("-", " ")}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}