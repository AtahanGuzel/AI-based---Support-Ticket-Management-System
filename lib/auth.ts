export type UserRole = "customer" | "agent" | "admin"

export const SUPPORT_CATEGORIES = ["Email", "Network", "Security", "Software"] as const
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]

export interface AppUser {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  /** Queue scope for agents; only tickets in this category appear on the staff panel. */
  supportCategory?: SupportCategory
}

export const MOCK_USERS: AppUser[] = [
  {
    firstName: "Ayse",
    lastName: "Yilmaz",
    email: "customer@example.com",
    password: "customer123",
    role: "customer",
  },
  {
    firstName: "Mert",
    lastName: "Kaya",
    email: "agent@example.com",
    password: "agent123",
    role: "agent",
    supportCategory: "Software",
  },
  {
    firstName: "Elif",
    lastName: "Demir",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
]

