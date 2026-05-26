"use client"

import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { MOCK_USERS, type MockUser } from "@/lib/auth"
import { setToken } from "@/lib/api"

interface AuthContextValue {
  user: MockUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; message?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// In-memory storage — never touches localStorage
let _memUser: MockUser | null = null
let _memToken: string | null = null

function generateFakeJWT(user: MockUser): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
  const payload = btoa(
    JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat: Date.now() })
  )
  return `${header}.${payload}.fake_signature`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (_memUser) {
      setUser(_memUser)
      setTokenState(_memToken)
      setToken(_memToken)
    }
    setIsLoading(false)
  }, [])

  const login = (email: string, password: string) => {
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password)
    if (!found) return { success: false, message: "Invalid email or password." }
    const t = generateFakeJWT(found)
    _memUser = found
    _memToken = t
    setUser(found)
    setTokenState(t)
    setToken(t)
    return { success: true }
  }

  const logout = () => {
    _memUser = null
    _memToken = null
    setUser(null)
    setTokenState(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
