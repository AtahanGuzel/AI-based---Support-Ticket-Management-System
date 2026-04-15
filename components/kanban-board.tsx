"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, User, GripVertical, Mail, Wifi, Monitor, Shield, Key, HardDrive, Ticket } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface KanbanTicket {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  status: "open" | "in-progress" | "resolved"
  category: string
  assignee?: {
    name: string
    initials: string
  }
  createdAt: string
  tags: string[]
  slaTime: string
}

const priorityConfig = {
  1: { label: "P1", className: "priority-p1" },
  2: { label: "P2", className: "priority-p2" },
  3: { label: "P3", className: "priority-p3" },
  4: { label: "P4", className: "priority-p4" },
  5: { label: "P5", className: "priority-p5" },
}

const columns = [
  { id: "open", title: "Open", color: "bg-primary", lightColor: "bg-primary/10" },
  { id: "in-progress", title: "In Progress", color: "bg-amber-500", lightColor: "bg-amber-50" },
  { id: "resolved", title: "Resolved", color: "bg-emerald-500", lightColor: "bg-emerald-50" },
] as const

const categoryIcons: Record<string, React.ElementType> = {
  "Email": Mail,
  "Network": Wifi,
  "Software": Monitor,
  "Hardware": HardDrive,
  "Security": Shield,
  "Access": Key,
  "General": Ticket,
}

interface KanbanBoardProps {
  tickets: KanbanTicket[]
  onTicketMove?: (ticketId: string, newStatus: KanbanTicket["status"]) => void
}

function TicketCard({ ticket }: { ticket: KanbanTicket }) {
  const CategoryIcon = categoryIcons[ticket.category] || Ticket
  
  return (
    <Link href={`/ticket/${ticket.id}`}>
      <div className="group cursor-pointer p-4 bg-white border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 card-premium-hover">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">#{ticket.id}</span>
              <Badge 
                variant="outline" 
                className={cn("text-[10px] px-1.5 py-0 h-[18px] font-semibold border", priorityConfig[ticket.priority].className)}
              >
                {priorityConfig[ticket.priority].label}
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {ticket.title}
            </h3>
          </div>
        </div>

        {/* Category & Tags */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-slate-50 text-muted-foreground border-0 gap-1">
            <CategoryIcon className="h-3 w-3" />
            {ticket.category}
          </Badge>
          {ticket.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/50 text-muted-foreground bg-white">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {ticket.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm">
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                    {ticket.assignee.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground font-medium">{ticket.assignee.name.split(' ')[0]}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <User className="h-3 w-3 text-muted-foreground/40" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">Unassigned</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-medium">{ticket.slaTime}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function KanbanBoard({ tickets }: KanbanBoardProps) {
  const getTicketsByStatus = (status: KanbanTicket["status"]) => {
    return tickets.filter((ticket) => ticket.status === status)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTickets = getTicketsByStatus(column.id)
        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header - Sticky */}
            <div className="sticky top-20 z-10 bg-background pb-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full shadow-sm", column.color)} />
                  <h3 className="text-sm font-semibold text-foreground">
                    {column.title}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs bg-white border border-border/50 shadow-sm font-semibold">
                  {columnTickets.length}
                </Badge>
              </div>
            </div>
            
            {/* Column Content */}
            <div className={cn("flex-1 rounded-2xl p-3 min-h-[400px]", column.lightColor)}>
              <div className="space-y-3">
                {columnTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/50 rounded-xl bg-white/50">
                    <Ticket className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground/60">No tickets</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Drag tickets here</p>
                  </div>
                ) : (
                  columnTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
