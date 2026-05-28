"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { AppUser } from "@/lib/auth"
import api from "@/lib/api"

interface AuthContextValue {
  user: AppUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const STORAGE_KEY = "ticket-app-user"
const TOKEN_KEY = "ticket-app-token"

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

  const login = async (email: string, password: string) => {
    try {
      // OAuth2PasswordRequestForm için form verisi hazırlıyoruz
      const formData = new URLSearchParams();
      formData.append('username', email); // FastAPI 'username' bekler
      formData.append('password', password);

      // Backend'e form-urlencoded olarak istek atıyoruz
      const response = await api.post("/auth/login", formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

      // Token'ı alıyoruz
      const token = response.data.access_token;
      
      // Kullanıcı bilgisini simüle ediyoruz (Backend'den kullanıcı verisi de dönüyorsa onu kullan)
      const userData = { 
          email: response.data.email, 
          role: response.data.role,
          firstName: response.data.firstName || "Misafir", // Backend'den gelen alan ismi neyse o
          lastName: response.data.lastName || "Kullanıcı"
      };// Burada backend'den dönen gerçek veriyi kullanabilirsin

      setUser(userData as AppUser)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      
      if (token) {
        window.localStorage.setItem(TOKEN_KEY, token)
      }

      return { success: true }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Invalid email or password."
      return { success: false, message: errorMessage }
    }
  }

  const logout = () => {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_KEY)
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