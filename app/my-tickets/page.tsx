"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, CheckCircle2, AlertCircle, Ticket, ExternalLink } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { api, type BackendTicket, normalizeStatus, deptToCategory, relativeTime } from "@/lib/api"
import { cn } from "@/lib/utils"

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: "P1", className: "priority-p1" },
  2: { label: "P2", className: "priority-p2" },
  3: { label: "P3", className: "priority-p3" },
  4: { label: "P4", className: "priority-p4" },
  5: { label: "P5", className: "priority-p5" },
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  "in-progress": { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  closed: { label: "Closed", className: "bg-slate-50 text-slate-600 border-slate-200", icon: CheckCircle2 },
}

interface UITicket {
  id: string
  ticketId: number
  title: string
  priority: number
  status: string
  category: string
  createdAt: string
  resolvedAt: string | null
}

function toUITicket(t: BackendTicket): UITicket {
  return {
    id: `TK-${t.ticket_id}`,
    ticketId: t.ticket_id,
    title: t.description,
    priority: Math.min(t.priority, 5),
    status: normalizeStatus(t.status),
    category: deptToCategory(t.department_id),
    createdAt: relativeTime(t.created_at),
    resolvedAt: t.resolved_at ? relativeTime(t.resolved_at) : null,
  }
}

function MyTicketsContent() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<UITicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api
      .getMyTickets(user.id)
      .then((data) => setTickets(data.map(toUITicket)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const activeTickets = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed")
  const resolvedTickets = tickets.filter((t) => t.status === "resolved" || t.status === "closed")

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">My Tickets</h1>
            <p className="text-sm text-muted-foreground">Track your support requests</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No tickets yet</h3>
              <p className="text-sm text-muted-foreground">
                Use the AI chat to submit a support request.
              </p>
            </div>
          ) : (
            <>
              {activeTickets.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground mb-4">
                    Active ({activeTickets.length})
                  </h2>
                  <div className="space-y-3">
                    {activeTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                </section>
              )}
              {resolvedTickets.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground mb-4">
                    Resolved ({resolvedTickets.length})
                  </h2>
                  <div className="space-y-3">
                    {resolvedTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function TicketCard({ ticket }: { ticket: UITicket }) {
  const pCfg = priorityConfig[ticket.priority] ?? priorityConfig[5]
  const sCfg = statusConfig[ticket.status] ?? statusConfig["open"]
  const StatusIcon = sCfg.icon

  return (
    <Card className="border-border/50 hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
              <Badge
                className={cn("text-[10px] px-1.5 py-0 h-[18px] font-semibold border", pCfg.className)}
              >
                {pCfg.label}
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-2">{ticket.title}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground">{ticket.category}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{ticket.createdAt}</span>
              {ticket.resolvedAt && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">Resolved {ticket.resolvedAt}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border", sCfg.className)}>
              <StatusIcon className="h-3 w-3" />
              {sCfg.label}
            </div>
            <Link href={`/ticket/${ticket.ticketId}`}>
              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyTicketsPage() {
  return (
    <ProtectedPage allowedRoles={["customer"]}>
      <MyTicketsContent />
    </ProtectedPage>
  )
}
