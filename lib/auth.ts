export type UserRole = "customer" | "agent" | "admin"

export interface AppUser {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
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
  },
  {
    firstName: "Elif",
    lastName: "Demir",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
]

