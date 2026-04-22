"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ChatInterface } from "@/components/chat-interface"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { user, login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    const result = login(email.trim(), password)
    if (!result.success) {
      setError(result.message || "Login failed")
      return
    }
    setError("")
    setEmail("")
    setPassword("")
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6">
        <Card className="w-full max-w-lg rounded-2xl shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to continue.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full">Login</Button>
            </form>

            <div className="rounded-xl border border-border/50 bg-slate-50 p-4 text-sm">
              <p className="font-semibold mb-2">Example users</p>
              <p>- Customer: customer@example.com / customer123</p>
              <p>- Agent: agent@example.com / agent123</p>
              <p>- Admin: admin@example.com / admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        <div className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Support</h1>
            <p className="text-sm text-muted-foreground">Add and track support problems</p>
          </div>
        </div>
        <div className="p-8">
          <ChatInterface />
        </div>
      </main>
    </div>
  )
}
