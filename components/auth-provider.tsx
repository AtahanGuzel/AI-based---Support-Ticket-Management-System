"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { AppUser } from "@/lib/auth"
import { MOCK_USERS } from "@/lib/auth"

interface AuthContextValue {
  user: AppUser | null
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; message?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const STORAGE_KEY = "ticket-app-user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppUser
      setUser(parsed)
    }
    setIsLoading(false)
  }, [])

  const login = (email: string, password: string) => {
    const foundUser = MOCK_USERS.find((candidate) => candidate.email === email && candidate.password === password)
    if (!foundUser) {
      return { success: false, message: "Invalid email or password." }
    }

    setUser(foundUser)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser))
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}

