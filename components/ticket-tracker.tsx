"use client"

import Link from "next/link"
import { Ticket, Monitor, Wifi, Shield, Key, HardDrive, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface TrackerTicket {
  id: string
  ticketId: number
  title: string
  priority: number
  status: string
  category: string
  createdAt: string
}

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: "P1", className: "priority-p1" },
  2: { label: "P2", className: "priority-p2" },
  3: { label: "P3", className: "priority-p3" },
  4: { label: "P4", className: "priority-p4" },
  5: { label: "P5", className: "priority-p5" },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700 border-blue-200" },
  "in-progress": { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
}

const categoryIcons: Record<string, React.ElementType> = {
  "IT & Hardware": HardDrive,
  "DevOps & Software": Package,
  "Financial Operations": Key,
  "HR & Admin": Shield,
  Network: Wifi,
  Security: Shield,
  Email: Monitor,
  General: Ticket,
}

export function TicketTracker({ tickets }: { tickets: TrackerTicket[] }) {
  return (
    <div className="w-72 shrink-0 flex flex-col rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 bg-gradient-to-r from-white to-slate-50/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Ticket className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Live Tickets</p>
          <p className="text-[10px] text-muted-foreground">{tickets.length} active</p>
        </div>
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Ticket className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-foreground">No active tickets</p>
            <p className="text-xs text-muted-foreground">Your tickets will appear here</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const CategoryIcon = categoryIcons[ticket.category] ?? Ticket
            const pCfg = priorityConfig[ticket.priority] ?? priorityConfig[5]
            const sCfg = statusConfig[ticket.status] ?? statusConfig["open"]

            return (
              <Link
                key={ticket.id}
                href={`/ticket/${ticket.ticketId}`}
                className="block rounded-xl border border-border/50 p-3 hover:border-primary/30 hover:shadow-sm transition-all bg-white"
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-muted-foreground">
                    <CategoryIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{ticket.id}</span>
                      <Badge
                        className={cn("text-[9px] px-1 py-0 h-[16px] font-semibold border", pCfg.className)}
                      >
                        {pCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-2">{ticket.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    className={cn("text-[9px] px-2 py-0 h-[18px] font-medium border-0", sCfg.className)}
                  >
                    {sCfg.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{ticket.createdAt}</span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
