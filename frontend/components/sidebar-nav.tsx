"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { 
  MessageSquare, 
  LayoutDashboard, 
  Headphones, 
  Settings,
  FileBarChart2,
  LogOut,
  Sparkles,
  ChevronRight,
  Ticket,
} from "lucide-react"
import type { UserRole } from "@/lib/auth"
import { Button } from "@/components/ui/button"

const roleNavigation: Record<string, Array<{ title: string; href: string; icon: React.ElementType; description: string }>> = {
  employee: [
    { title: "AI Support", href: "/", icon: MessageSquare, description: "Create problems" },
    { title: "My Tickets", href: "/my-tickets", icon: Ticket, description: "My requests" },
    { title: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
  ],
  customer: [
    { title: "AI Support", href: "/", icon: MessageSquare, description: "Create problems" },
    { title: "My Tickets", href: "/my-tickets", icon: Ticket, description: "My requests" },
    { title: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
  ],
  agent: [
    { title: "AI Support", href: "/", icon: MessageSquare, description: "Create problems" },
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Kanban board" },
    { title: "Staff Panel", href: "/staff", icon: Headphones, description: "Resolve tickets" },
    { title: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
  ],
  admin: [
    { title: "AI Support", href: "/", icon: MessageSquare, description: "Create problems" },
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Ticket overview" },
    { title: "All Tickets", href: "/all-tickets", icon: Ticket, description: "Full ticket list" },
    { title: "Report", href: "/report", icon: FileBarChart2, description: "Weekly summary" },
    { title: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
  ],
}

export function SidebarNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const navItems = roleNavigation[user.role]
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
<div className="flex h-16 items-center border-b border-border/50 px-6">
  <img src="/triage.png" alt="Triage" className="h-18 w-auto" />
</div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 mb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-accent/5 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "bg-slate-50 text-muted-foreground group-hover:bg-slate-100 group-hover:text-foreground"
                )}>
                  <item.icon className="h-[18px] w-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{item.title}</span>
                  <span className={cn(
                    "text-[10px] truncate block",
                    isActive ? "text-primary/70" : "text-muted-foreground/70"
                  )}>{item.description}</span>
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-primary/50" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-white px-3 py-3 border border-border/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">{user.role}</p>
          <Button
            variant="outline"
            className="mt-3 w-full rounded-xl border-border/50"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
