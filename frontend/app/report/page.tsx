"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Ticket,
  CheckCircle2,
  Clock,
  Zap,
  Bot,
  Users,
  Star,
  AlertTriangle,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK = {
  summary: {
    totalTickets: 143,
    resolvedTickets: 98,
    avgResolutionHours: 4.2,
    resolutionRate: 68.5,
  },
  departments: [
    { name: "IT", tickets: 67, avgResolutionHours: 3.1, color: "bg-blue-500" },
    { name: "HR", tickets: 38, avgResolutionHours: 5.8, color: "bg-emerald-500" },
    { name: "Finance", tickets: 24, avgResolutionHours: 6.2, color: "bg-amber-500" },
    { name: "Other", tickets: 14, avgResolutionHours: 4.9, color: "bg-purple-500" },
  ],
  urgency: [
    { level: 1, label: "Low", count: 28, color: "bg-slate-400" },
    { level: 2, label: "Normal", count: 42, color: "bg-blue-400" },
    { level: 3, label: "Medium", count: 39, color: "bg-amber-400" },
    { level: 4, label: "High", count: 22, color: "bg-orange-500" },
    { level: 5, label: "Critical", count: 12, color: "bg-red-500" },
  ],
  criticalAvgResolutionHours: 2.1,
  ai: {
    kbDeflected: 54,
    escalatedToStaff: 89,
    deflectionRate: 37.8,
  },
  staff: [
    { name: "IT Agent", resolved: 34, avgResponseMin: 18, satisfaction: 4.7 },
    { name: "HR Agent", resolved: 28, avgResponseMin: 24, satisfaction: 4.5 },
    { name: "Finance Agent", resolved: 21, avgResponseMin: 31, satisfaction: 4.3 },
    { name: "Other Agent", resolved: 15, avgResponseMin: 22, satisfaction: 4.6 },
  ],
  trend: {
    ticketChangePercent: +12.4,
    topCategories: [
      { name: "VPN & Network Issues", count: 31 },
      { name: "Password & Account Access", count: 24 },
      { name: "Email & Outlook", count: 19 },
      { name: "Hardware Requests", count: 16 },
      { name: "Software Installation", count: 14 },
    ],
    recurringIssues: [
      { issue: "VPN disconnecting after OS update", count: 8 },
      { issue: "Outlook not syncing on mobile", count: 6 },
      { issue: "Salary payment delay", count: 5 },
      { issue: "Shared drive access denied", count: 4 },
    ],
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ?? "bg-slate-50"}`}>
          <Icon className="h-5 w-5 text-current" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs font-medium text-primary">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max((value / Math.max(max, 1)) * 100, 4)
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{rating}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Period = "weekly" | "monthly"

export default function ReportPage() {
  const [period, setPeriod] = useState<Period>("monthly")
  const maxDeptTickets = Math.max(...MOCK.departments.map((d) => d.tickets))
  const maxUrgencyCount = Math.max(...MOCK.urgency.map((u) => u.count))

  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 pl-64">
          {/* Header */}
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-white/80 px-8 backdrop-blur-xl">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Operations Report</h1>
              <p className="text-sm text-muted-foreground">Full system metrics and performance overview</p>
            </div>
            <div className="flex items-center gap-3">
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
              <Button variant="outline" className="gap-2 rounded-xl">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl">
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="space-y-8 p-8">

            {/* ── 1. Genel Özet ─────────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                1 · General Summary
              </h2>
              <div className="grid grid-cols-4 gap-5">
                <StatCard
                  icon={Ticket}
                  label="Total tickets opened"
                  value={MOCK.summary.totalTickets}
                  accent="bg-slate-100 text-slate-600"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Resolved tickets"
                  value={MOCK.summary.resolvedTickets}
                  sub={`${MOCK.summary.resolutionRate}% resolution rate`}
                  accent="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  icon={Clock}
                  label="Avg resolution time"
                  value={`${MOCK.summary.avgResolutionHours}h`}
                  accent="bg-blue-50 text-blue-600"
                />
                <StatCard
                  icon={BarChart3}
                  label="Tickets pending"
                  value={MOCK.summary.totalTickets - MOCK.summary.resolvedTickets}
                  accent="bg-amber-50 text-amber-600"
                />
              </div>
            </section>

            {/* ── 2. Departman Bazlı ────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                2 · Department Breakdown
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Ticket volume by department</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {MOCK.departments.map((dept) => (
                      <div key={dept.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${dept.color}`} />
                            <span className="font-medium">{dept.name}</span>
                            {dept.tickets === maxDeptTickets && (
                              <Badge variant="secondary" className="text-[10px]">Most tickets</Badge>
                            )}
                          </div>
                          <span className="font-semibold text-foreground">{dept.tickets}</span>
                        </div>
                        <ProgressBar value={dept.tickets} max={maxDeptTickets} color={dept.color} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Avg resolution time by department</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {MOCK.departments
                      .slice()
                      .sort((a, b) => a.avgResolutionHours - b.avgResolutionHours)
                      .map((dept, i) => (
                        <div key={dept.name} className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                            <span className="font-medium text-sm">{dept.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-semibold">{dept.avgResolutionHours}h avg</span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── 3. Urgency Dağılımı ───────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                3 · Urgency Distribution
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tickets per urgency level</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {MOCK.urgency.map((u) => (
                      <div key={u.level} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${u.color}`} />
                            <span className="font-medium">P{u.level} — {u.label}</span>
                          </div>
                          <span className="font-semibold">{u.count}</span>
                        </div>
                        <ProgressBar value={u.count} max={maxUrgencyCount} color={u.color} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Critical tickets (P1–P2)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl bg-red-50 border border-red-100 p-5">
                      <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Critical volume</p>
                      <p className="mt-1 text-4xl font-bold text-red-700">
                        {MOCK.urgency.filter(u => u.level >= 4).reduce((s, u) => s + u.count, 0)}
                      </p>
                      <p className="text-sm text-red-600 mt-1">tickets at P1 or P2</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                      <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Avg resolution (critical)</p>
                      <p className="mt-1 text-4xl font-bold text-amber-700">{MOCK.criticalAvgResolutionHours}h</p>
                      <p className="text-sm text-amber-600 mt-1">faster than overall avg</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── 4. AI Performansı ─────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                4 · AI Performance
              </h2>
              <div className="grid grid-cols-3 gap-5">
                <Card className="col-span-1">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{MOCK.ai.deflectionRate}%</p>
                        <p className="text-xs text-muted-foreground">AI deflection rate</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${MOCK.ai.deflectionRate}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {MOCK.ai.kbDeflected} tickets resolved by KB without staff involvement
                    </p>
                  </CardContent>
                </Card>

                <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{MOCK.ai.kbDeflected}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Resolved via Knowledge Base</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">No staff needed</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{MOCK.ai.escalatedToStaff}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Escalated to support staff</p>
                    <p className="text-xs text-amber-600 font-medium mt-1">Requires human handling</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 5. Support Staff Performansı ─────────────────────────── */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                5 · Support Staff Performance
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Agent performance breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-border/50">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Agent</th>
                          <th className="px-4 py-3 text-center">Resolved tickets</th>
                          <th className="px-4 py-3 text-center">Avg response time</th>
                          <th className="px-4 py-3 text-center">Satisfaction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {MOCK.staff
                          .slice()
                          .sort((a, b) => b.resolved - a.resolved)
                          .map((agent, i) => (
                            <tr key={agent.name} className="bg-white hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {i === 0 && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">Top</Badge>}
                                  <span className="font-medium">{agent.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold text-foreground">{agent.resolved}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-muted-foreground">{agent.avgResponseMin} min</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Stars rating={agent.satisfaction} />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── 6. Trend ──────────────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                6 · Trends
              </h2>
              <div className="grid grid-cols-3 gap-5">
                {/* MoM change */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Month-over-month change</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`flex items-center gap-3 rounded-xl p-4 ${MOCK.trend.ticketChangePercent > 0 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}`}>
                      {MOCK.trend.ticketChangePercent > 0
                        ? <ArrowUp className="h-8 w-8 text-red-500" />
                        : <ArrowDown className="h-8 w-8 text-emerald-500" />}
                      <div>
                        <p className={`text-3xl font-bold ${MOCK.trend.ticketChangePercent > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {MOCK.trend.ticketChangePercent > 0 ? "+" : ""}{MOCK.trend.ticketChangePercent}%
                        </p>
                        <p className={`text-xs font-medium ${MOCK.trend.ticketChangePercent > 0 ? "text-red-500" : "text-emerald-500"}`}>
                          vs last month
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {MOCK.trend.ticketChangePercent > 0
                        ? "Ticket volume is increasing. Consider reviewing staffing."
                        : "Ticket volume is decreasing. Good progress!"}
                    </p>
                  </CardContent>
                </Card>

                {/* Top categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top problem categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {MOCK.trend.topCategories.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground shrink-0">#{i + 1}</span>
                          <span className="text-sm truncate">{cat.name}</span>
                        </div>
                        <Badge variant="outline" className="shrink-0">{cat.count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recurring issues */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recurring issues</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {MOCK.trend.recurringIssues.map((issue) => (
                      <div key={issue.issue} className="flex items-start justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="text-xs text-foreground">{issue.issue}</span>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-amber-200 text-amber-700">{issue.count}x</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}