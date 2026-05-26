const API_BASE = "http://localhost:8000"

let _token: string | null = null

export function getToken(): string | null {
  return _token
}

export function setToken(t: string | null): void {
  _token = t
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (_token) headers["Authorization"] = `Bearer ${_token}`
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export interface BackendTicket {
  ticket_id: number
  user_id: number
  department_id: number
  description: string
  status: string
  priority: number
  created_at: string
  resolved_at?: string | null
}

export interface BackendMessage {
  message_id: number
  sender_id: number
  message_body: string
  created_at: string
}

export interface BackendTicketDetail extends BackendTicket {
  conversation_history: BackendMessage[]
}

export const api = {
  getAllTickets: () => apiFetch<BackendTicket[]>("/tickets/"),
  getMyTickets: (userId: number) =>
    apiFetch<BackendTicket[]>(`/tickets/my-tickets?user_id=${userId}`),
  getTicketDetail: (ticketId: number) =>
    apiFetch<BackendTicketDetail>(`/tickets/${ticketId}`),
  submitTicket: (userId: number, description: string) =>
    apiFetch<{ status: string; message: string; ticket_id: number }>("/tickets/submit", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, issue_description: description }),
    }),
  addMessage: (ticketId: number, senderId: number, body: string) =>
    apiFetch<{ message: string; message_id: number }>(`/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ sender_id: senderId, message_body: body }),
    }),
  updateStatus: (ticketId: number, status: string) =>
    apiFetch<{ message: string; ticket_id: number; status: string }>(
      `/tickets/${ticketId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    ),
}

export function normalizeStatus(s: string): string {
  return s === "in_progress" ? "in-progress" : s
}

export function deptToCategory(deptId: number): string {
  const map: Record<number, string> = {
    1: "IT & Hardware",
    2: "DevOps & Software",
    3: "Financial Operations",
    4: "HR & Admin",
  }
  return map[deptId] ?? "Other"
}

export function priorityLabel(p: number): string {
  return `P${Math.min(p, 5)}`
}

export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
