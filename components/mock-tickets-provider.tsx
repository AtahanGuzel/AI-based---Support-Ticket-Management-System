"use client"

import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import {
  INITIAL_MOCK_SUPPORT_TICKETS,
  type MockSupportTicket,
} from "@/lib/mock-support-tickets"

interface MockTicketsContextValue {
  tickets: MockSupportTicket[]
  setTickets: Dispatch<SetStateAction<MockSupportTicket[]>>
}

const MockTicketsContext = createContext<MockTicketsContextValue | null>(null)

export function MockTicketsProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<MockSupportTicket[]>(INITIAL_MOCK_SUPPORT_TICKETS)

  const value = useMemo(
    () => ({
      tickets,
      setTickets,
    }),
    [tickets]
  )

  return <MockTicketsContext.Provider value={value}>{children}</MockTicketsContext.Provider>
}

export function useMockTickets() {
  const ctx = useContext(MockTicketsContext)
  if (!ctx) {
    throw new Error("useMockTickets must be used within MockTicketsProvider")
  }
  return ctx
}
