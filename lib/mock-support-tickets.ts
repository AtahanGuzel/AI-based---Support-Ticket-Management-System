export interface MockSupportTicket {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  status: "open" | "in-progress" | "resolved"
  category: string
  requesterEmail: string
}

export const INITIAL_MOCK_SUPPORT_TICKETS: MockSupportTicket[] = [
  {
    id: "TK-1234",
    title: "Email sync not working on mobile",
    priority: 2,
    status: "in-progress",
    category: "Email",
    requesterEmail: "customer@example.com",
  },
  {
    id: "TK-1233",
    title: "Request for new monitor",
    priority: 4,
    status: "open",
    category: "Hardware",
    requesterEmail: "customer@example.com",
  },
  {
    id: "TK-1232",
    title: "VPN disconnects frequently",
    priority: 3,
    status: "open",
    category: "Network",
    requesterEmail: "alex.customer@example.com",
  },
  {
    id: "TK-1241",
    title: "Zoom video quality issues during meetings",
    priority: 4,
    status: "resolved",
    category: "Software",
    requesterEmail: "customer@example.com",
  },
]
