"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  MessageSquare, 
  LayoutDashboard, 
  Headphones, 
  Settings,
  Sparkles,
  ChevronRight
} from "lucide-react"

const navItems = [
  {
    title: "AI Support",
    href: "/",
    icon: MessageSquare,
    description: "Chat with AI",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Kanban board",
  },
  {
    title: "Staff Panel",
    href: "/staff",
    icon: Headphones,
    description: "Manage tickets",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences",
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-foreground truncate block">TicketManagement</span>
            <span className="text-[10px] text-muted-foreground">System v1.0</span>
          </div>
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
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">John Doe</p>
              <p className="text-[11px] text-muted-foreground truncate">john@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
