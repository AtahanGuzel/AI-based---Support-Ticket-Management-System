"use client"

import Link from "next/link"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { useMockTickets } from "@/components/mock-tickets-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MockSupportTicket } from "@/lib/mock-support-tickets"
import { ArrowRight, Ticket } from "lucide-react"

function sortCustomerTickets(list: MockSupportTicket[]) {
  const rank: Record<MockSupportTicket["status"], number> = {
    open: 0,
    "in-progress": 1,
    resolved: 2,
  }
  return [...list].sort((a, b) => {
    const byStatus = rank[a.status] - rank[b.status]
    if (byStatus !== 0) return byStatus
    return b.id.localeCompare(a.id)
  })
}

function ticketStatusBadgeClass(status: MockSupportTicket["status"]) {
  switch (status) {
    case "open":
      return "border-sky-200/80 bg-sky-50 text-sky-800"
    case "in-progress":
      return "border-amber-200/80 bg-amber-50 text-amber-800"
    case "resolved":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-800"
    default:
      return ""
  }
}

function ticketStatusLabel(status: MockSupportTicket["status"]) {
  switch (status) {
    case "open":
      return "Open"
    case "in-progress":
      return "In progress"
    case "resolved":
      return "Resolved"
    default:
      return status
  }
}

export default function MyTicketsPage() {
  const { user } = useAuth()
  const { tickets } = useMockTickets()

  const myTickets = user
    ? sortCustomerTickets(tickets.filter((t) => t.requesterEmail === user.email))
    : []

  return (
    <ProtectedPage allowedRoles={["customer"]}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64">
          <div className="sticky top-0 z-30 flex h-16 items-center border-b border-border/50 bg-white/80 px-8 backdrop-blur-xl">
            <div>
              <h1 className="text-lg font-semibold text-foreground">My Tickets</h1>
              <p className="text-sm text-muted-foreground">Your support requests and current statuses</p>
            </div>
          </div>

          <div className="p-8">
            {myTickets.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-muted-foreground">
                  <Ticket className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-foreground">No tickets yet</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Start from AI Support and if needed create a ticket from the chat flow.
                </p>
                <Button asChild className="mt-5 rounded-xl">
                  <Link href="/">
                    Go to AI Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/ticket/${ticket.id}`}
                    className="block rounded-2xl border border-border/50 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">#{ticket.id}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{ticket.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{ticket.category}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-6 shrink-0 border px-2 text-[10px] font-semibold uppercase tracking-wide",
                          ticketStatusBadgeClass(ticket.status)
                        )}
                      >
                        {ticketStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}
