import { SidebarNav } from "@/components/sidebar-nav"
import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Support</h1>
            <p className="text-sm text-muted-foreground">Get instant help from our AI assistant</p>
          </div>
        </div>
        <div className="p-8">
          <ChatInterface />
        </div>
      </main>
    </div>
  )
}
