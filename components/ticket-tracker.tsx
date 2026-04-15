"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight, Ticket, Mail, Wifi, Monitor, Shield, Key, HardDrive } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface Ticket {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  status: "open" | "in-progress" | "resolved"
  slaTime: string
  category: string
}

const priorityConfig = {
  1: { label: "P1", className: "priority-p1" },
  2: { label: "P2", className: "priority-p2" },
  3: { label: "P3", className: "priority-p3" },
  4: { label: "P4", className: "priority-p4" },
  5: { label: "P5", className: "priority-p5" },
}

const statusConfig = {
  "open": { label: "Open", className: "bg-primary/10 text-primary" },
  "in-progress": { label: "In Progress", className: "bg-amber-50 text-amber-600" },
  "resolved": { label: "Resolved", className: "bg-emerald-50 text-emerald-600" },
}

const categoryIcons: Record<string, React.ElementType> = {
  "Email": Mail,
  "Network": Wifi,
  "Software": Monitor,
  "Hardware": HardDrive,
  "Security": Shield,
  "Access": Key,
  "General": Ticket,
}

interface TicketTrackerProps {
  tickets: Ticket[]
}

export function TicketTracker({ tickets }: TicketTrackerProps) {
  return (
    <div className="h-full rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-white to-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Ticket className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Live Tickets</h2>
          </div>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            View all
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
      
      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Ticket className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No active tickets</p>
            <p className="text-xs text-muted-foreground">Your tickets will appear here</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const CategoryIcon = categoryIcons[ticket.category] || Ticket
            return (
              <Link key={ticket.id} href={`/ticket/${ticket.id}`}>
                <div className="p-4 rounded-xl border border-border/50 bg-white hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer group card-premium-hover">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-medium text-muted-foreground">#{ticket.id}</span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] px-1.5 py-0 h-[18px] font-semibold border", priorityConfig[ticket.priority].className)}
                          >
                            {priorityConfig[ticket.priority].label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {ticket.title}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-[10px] px-2 py-0.5 h-5 font-medium border-0", statusConfig[ticket.status].className)}
                    >
                      {statusConfig[ticket.status].label}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">{ticket.slaTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
