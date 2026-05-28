"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { ChatInterface } from "@/components/chat-interface"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError("")
    
    // Asenkron login fonksiyonunu bekliyoruz
    const result = await login(email.trim(), password)
    
    if (!result.success) {
      setError(result.message || "Login failed")
      setIsSubmitting(false)
      return
    }
    
    setEmail("")
    setPassword("")
    setIsSubmitting(false)
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="rounded-xl border border-border/50 bg-slate-50 p-4 text-sm">
              <p className="font-semibold mb-2">Example users</p>
              <p className="text-muted-foreground mb-2 text-xs">
                Sistem artık gerçek veritabanına bağlıdır. Veritabanında kayıtlı olan kullanıcılarla giriş yapın.
              </p>
              <p>- destek.uzmani@test.com</p>
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