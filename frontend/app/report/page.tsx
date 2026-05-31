"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardMockTickets } from "@/lib/dashboard-tickets"
import { AlertTriangle, Download, FileText } from "lucide-react"

function ageInHours(createdAt: string) {
  if (createdAt.endsWith("h ago")) return Number(createdAt.replace("h ago", ""))
  if (createdAt.endsWith("d ago")) return Number(createdAt.replace("d ago", "")) * 24
  return 0
}

type ReportPeriod = "weekly" | "monthly"

export default function ReportPage() {
  const [period, setPeriod] = useState<ReportPeriod>("weekly")
  const reportTickets =
    period === "weekly"
      ? dashboardMockTickets.filter((ticket) => ageInHours(ticket.createdAt) <= 48)
      : dashboardMockTickets

  const categoryCounts = Object.entries(
    reportTickets.reduce<Record<string, number>>((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] ?? 0) + 1
      return acc
    }, {})
  )
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const recurringIssues = Object.entries(
    reportTickets.reduce<Record<string, number>>((acc, ticket) => {
      acc[ticket.title] = (acc[ticket.title] ?? 0) + 1
      return acc
    }, {})
  )
    .filter(([, count]) => count > 1)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)

  const criticalOpen = reportTickets
    .filter((ticket) => ticket.priority <= 2 && ticket.status !== "resolved")
    .sort((a, b) => ageInHours(b.createdAt) - ageInHours(a.createdAt))

  const oldestOpen = reportTickets
    .filter((ticket) => ticket.status !== "resolved")
    .sort((a, b) => ageInHours(b.createdAt) - ageInHours(a.createdAt))
    .slice(0, 5)

  const oldestOpenTicket = oldestOpen[0]
  const oldestOpenWaitText = oldestOpenTicket
    ? oldestOpenTicket.createdAt.includes("d ago")
      ? `${oldestOpenTicket.createdAt.replace("d ago", "").trim()} gün`
      : `${oldestOpenTicket.createdAt.replace("h ago", "").trim()} saat`
    : null

  const activeByAssignee = Object.entries(
    reportTickets
      .filter((ticket) => ticket.status !== "resolved")
      .reduce<Record<string, number>>((acc, ticket) => {
        const assignee = ticket.assignee?.name ?? "Unassigned"
        acc[assignee] = (acc[assignee] ?? 0) + 1
        return acc
      }, {})
  )
    .map(([assignee, total]) => ({ assignee, total }))
    .sort((a, b) => b.total - a.total)

  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64">
          <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-8">
            <div className="flex w-full items-center justify-between gap-4">
              <div>
              <h1 className="text-lg font-semibold text-foreground">Operations Report</h1>
              <p className="text-sm text-muted-foreground">Recurring issues, risk queues, aging, and team workload</p>
              </div>
              <div className="flex items-center rounded-xl border border-border/50 bg-white p-1 shadow-sm">
                <Button
                  variant={period === "weekly" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 rounded-lg px-3"
                  onClick={() => setPeriod("weekly")}
                >
                  Weekly
                </Button>
                <Button
                  variant={period === "monthly" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 rounded-lg px-3"
                  onClick={() => setPeriod("monthly")}
                >
                  Monthly
                </Button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Email and hardware requests are still the top incoming themes. Priority P1-P2 queue has
                  {` ${criticalOpen.length} `}active tickets and should be reviewed first in the next shift.
                </p>
                {oldestOpenWaitText && (
                  <p className="text-sm font-medium text-foreground">
                    Attention: the oldest open ticket has been waiting for {oldestOpenWaitText}.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export {period === "weekly" ? "weekly" : "monthly"} CSV
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export {period === "weekly" ? "weekly" : "monthly"} PDF snapshot
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top recurring issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recurringIssues.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No repeated issue titles detected this week.</p>
                  ) : (
                    recurringIssues.map((item) => (
                      <div key={item.title} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <span className="line-clamp-2 text-sm font-medium">{item.title}</span>
                        <Badge variant="outline">{item.count}x</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryCounts.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-muted-foreground">{item.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-primary/70"
                          style={{ width: `${Math.max((item.total / Math.max(reportTickets.length, 1)) * 100, 10)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Critical open tickets (P1-P2)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {criticalOpen.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">#{ticket.id}</p>
                        <p className="truncate text-sm font-medium">{ticket.title}</p>
                      </div>
                      <Badge variant="outline">P{ticket.priority}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Oldest active tickets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {oldestOpen.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">#{ticket.id}</p>
                        <p className="truncate text-sm font-medium">{ticket.title}</p>
                      </div>
                      <Badge variant="secondary">{ticket.createdAt}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agent workload snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeByAssignee.map((item) => (
                  <div key={item.assignee} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <span className="font-medium">{item.assignee}</span>
                    <Badge variant={item.assignee === "Unassigned" ? "destructive" : "outline"}>
                      {item.total} active
                    </Badge>
                  </div>
                ))}
                {activeByAssignee.some((item) => item.assignee === "Unassigned") && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Some active tickets are unassigned. Consider balancing load in Staff panel.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}

