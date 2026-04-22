"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/lib/auth"
import { useAuth } from "@/components/auth-provider"

interface ProtectedPageProps {
  allowedRoles?: UserRole[]
  children: React.ReactNode
}

export function ProtectedPage({ allowedRoles, children }: ProtectedPageProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/")
      return
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/")
    }
  }, [allowedRoles, isLoading, router, user])

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="min-h-screen bg-background" />
  }

  return <>{children}</>
}

