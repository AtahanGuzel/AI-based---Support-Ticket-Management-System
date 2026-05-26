"use client"

// TODO: endpoint not implemented yet - using mock report data

import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const weeklyReport = {
  period: "May 19 – May 25, 2025",
  totalTickets: 142,
  resolved: 118,
  avgResolutionHours: 4.2,
  satisfaction: 94,
  byDepartment: [
    { name: "IT & Hardware Support", tickets: 58, resolved: 51 },
    { name: "DevOps & Software", tickets: 42, resolved: 35 },
    { name: "Financial Operations", tickets: 24, resolved: 21 },
    { name: "HR & Admin", tickets: 18, resolved: 11 },
  ],
  topIssues: [
    { issue: "Password / Account Access", count: 23 },
    { issue: "Network / VPN Connectivity", count: 19 },
    { issue: "Software Installation", count: 15 },
    { issue: "Hardware Request", count: 12 },
    { issue: "Email Configuration", count: 9 },
  ],
}

function ReportContent() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Weekly Report</h1>
            <p className="text-sm text-muted-foreground">{weeklyReport.period}</p>
          </div>
          <Badge variant="secondary" className="text-xs">Mock Data</Badge>
        </div>

        <div className="p-8 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-5">
            {[
              { label: "Total Tickets", value: weeklyReport.totalTickets, color: "text-primary" },
              { label: "Resolved", value: weeklyReport.resolved, color: "text-emerald-600" },
              { label: "Avg Resolution", value: `${weeklyReport.avgResolutionHours}h`, color: "text-amber-600" },
              { label: "Satisfaction", value: `${weeklyReport.satisfaction}%`, color: "text-blue-600" },
            ].map((kpi) => (
              <Card key={kpi.label} className="border-border/50">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{kpi.label}</p>
                  <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* By department */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Tickets by Department</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyReport.byDepartment.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-foreground truncate">{dept.name}</p>
                      <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(dept.resolved / dept.tickets) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{dept.tickets}</p>
                      <p className="text-[10px] text-muted-foreground">{dept.resolved} resolved</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top issues */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Top Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyReport.topIssues.map((item, i) => (
                  <div key={item.issue} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                      <p className="text-sm text-foreground">{item.issue}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ReportPage() {
  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <ReportContent />
    </ProtectedPage>
  )
}
