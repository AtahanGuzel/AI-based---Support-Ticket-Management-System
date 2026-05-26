// TODO: endpoint not implemented yet - using mock authentication
export interface MockUser {
  id: number
  firstName: string
  lastName: string
  email: string
  password: string
  role: "customer" | "agent" | "admin"
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    firstName: "Ayse",
    lastName: "Yilmaz",
    email: "customer@example.com",
    password: "customer123",
    role: "customer",
  },
  {
    id: 2,
    firstName: "Mert",
    lastName: "Kaya",
    email: "agent@example.com",
    password: "agent123",
    role: "agent",
  },
  {
    id: 3,
    firstName: "Elif",
    lastName: "Demir",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
]
