"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const weeklyReport = {
  week: "April 14 - April 20, 2026",
  totalProblems: 68,
  resolvedByAI: 41,
  resolvedByAgents: 20,
  stillOpen: 7,
  byCategory: [
    { category: "Email", total: 18 },
    { category: "Network", total: 15 },
    { category: "Software", total: 14 },
    { category: "Hardware", total: 11 },
    { category: "Access", total: 10 },
  ],
}

export default function ReportPage() {
  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64">
          <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-8">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Weekly Report</h1>
              <p className="text-sm text-muted-foreground">Hardcoded example report for administrators</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Week: {weeklyReport.week}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Problems</p>
                  <p className="text-2xl font-semibold">{weeklyReport.totalProblems}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved by AI</p>
                  <p className="text-2xl font-semibold text-primary">{weeklyReport.resolvedByAI}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved by Agents</p>
                  <p className="text-2xl font-semibold text-emerald-600">{weeklyReport.resolvedByAgents}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Still Open</p>
                  <p className="text-2xl font-semibold text-amber-600">{weeklyReport.stillOpen}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Problem Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyReport.byCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <span className="font-medium">{item.category}</span>
                    <Badge variant="outline">{item.total}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}

