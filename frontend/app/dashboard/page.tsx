"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, Clock, CheckCircle2, AlertTriangle, Headphones, ArrowRight, ListChecks } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { apiGetAllTickets, type ApiTicket } from "@/lib/api"

export default function DashboardPage() {
  const { user } = useAuth()
  const isAgent = user?.role === "agent"
  const [tickets, setTickets] = useState<ApiTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGetAllTickets()
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    urgent: tickets.filter((t) => t.priority <= 2 && t.status !== "resolved").length,
  }

  const recentTickets = tickets.slice(0, 8)
  const urgentTickets = tickets.filter((t) => t.priority <= 2 && t.status !== "resolved").slice(0, 5)

  return (
    <ProtectedPage allowedRoles={["agent", "admin", "employee"]}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64">
          <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Ticket Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {isAgent ? "Overview · manage tickets in Staff panel" : "Manage and track all support tickets"}
              </p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-5">
              <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
                    <Ticket className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground bg-slate-50 px-2 py-1 rounded-full">Total</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{loading ? "—" : stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">All tickets</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex h-3 w-3 rounded-full bg-primary animate-pulse" />
                </div>
                <p className="text-3xl font-bold text-foreground">{loading ? "—" : stats.open}</p>
                <p className="text-sm text-muted-foreground mt-1">Open tickets</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <p className="text-3xl font-bold text-foreground">{loading ? "—" : stats.inProgress}</p>
                <p className="text-sm text-muted-foreground mt-1">In progress</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{loading ? "—" : stats.resolved}</p>
                <p className="text-sm text-muted-foreground mt-1">Resolved</p>
              </div>
            </div>

            {isAgent ? (
              <>
                <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">Your queue</h2>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                      Day-to-day replies and ticket actions live in the staff panel.
                    </p>
                  </div>
                  <Button asChild className="h-11 shrink-0 gap-2 rounded-xl">
                    <Link href="/staff">
                      <Headphones className="h-4 w-4" />
                      Open staff panel
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">Recent tickets</h3>
                  <ul className="mt-4 divide-y divide-border/50">
                    {loading ? (
                      <li className="py-8 text-center text-sm text-muted-foreground">Loading…</li>
                    ) : recentTickets.length === 0 ? (
                      <li className="py-8 text-center text-sm text-muted-foreground">No tickets found.</li>
                    ) : (
                      recentTickets.map((t) => (
                        <li key={t.ticket_id} className="flex items-center gap-3 py-3">
                          <Link
                            href={`/ticket/${t.ticket_id}`}
                            className="min-w-0 flex-1 text-sm font-medium text-foreground hover:text-primary hover:underline"
                          >
                            <span className="text-muted-foreground">#{t.ticket_id}</span> · {t.description.slice(0, 60)}
                          </Link>
                          <Badge variant="secondary" className="shrink-0 capitalize">
                            {t.status.replace("_", " ")}
                          </Badge>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Admin overview</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        High-level monitoring — manage full operations in All Tickets.
                      </p>
                    </div>
                    <Button asChild className="h-11 shrink-0 gap-2 rounded-xl">
                      <Link href="/all-tickets">
                        <ListChecks className="h-4 w-4" />
                        View all tickets
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground">Urgent tickets (P1-P2)</h3>
                    <ul className="mt-3 space-y-2">
                      {urgentTickets.map((ticket) => (
                        <li key={ticket.ticket_id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2.5">
                          <Link href={`/ticket/${ticket.ticket_id}`} className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary hover:underline">
                            <span className="text-muted-foreground">#{ticket.ticket_id}</span> {ticket.description.slice(0, 50)}
                          </Link>
                          <Badge variant="outline" className="shrink-0">P{ticket.priority}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground">Recent tickets</h3>
                    <ul className="mt-3 space-y-2">
                      {recentTickets.slice(0, 5).map((ticket) => (
                        <li key={ticket.ticket_id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2.5">
                          <Link href={`/ticket/${ticket.ticket_id}`} className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary hover:underline">
                            <span className="text-muted-foreground">#{ticket.ticket_id}</span> {ticket.description.slice(0, 50)}
                          </Link>
                          <Badge variant="secondary" className="capitalize">
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}