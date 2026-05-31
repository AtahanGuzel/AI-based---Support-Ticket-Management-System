/**
 * Centralized API client for the support ticket backend.
 * Base URL is read from NEXT_PUBLIC_API_URL (defaults to http://localhost:8000).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const TOKEN_KEY = "auth-token"
const USER_KEY = "ticket-app-user"

export interface AiAnalyzeResponse {
  intent: string
  department: string | null
  urgency: number
  clarification_question: string | null
  kb_query: string | null
  duplicate_of: string | null
  response_to_user: string
  kb_title?: string | null
}

export async function apiDeleteSession(sessionId: string): Promise<void> {
  const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001"
  await fetch(`${AI_URL}/ai/session/${sessionId}`, { method: "DELETE" }).catch(() => {})
}

export async function apiAnalyze(
  user_id: string,
  session_id: string,
  message: string
): Promise<AiAnalyzeResponse> {
  const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001"
  const res = await fetch(`${AI_URL}/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, session_id, message }),
  })
  if (!res.ok) throw new Error(`AI error: ${res.status}`)
  return res.json()
}

export async function apiStoreTicket(ticket_id: string, message: string): Promise<void> {
  const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001"
  await fetch(`${AI_URL}/ai/store_ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket_id, message }),
  })
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function clearAuth() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {}
    throw new Error(detail)
  }

  // 204 No Content or empty body
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : ({} as T)
}


// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string
  token_type: string
  user_id: number
  role: string
  full_name: string
  email: string
  department_id: number | null
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function apiGetMe(): Promise<{
  user_id: number
  full_name: string
  email: string
  role: string
  department_id: number | null
}> {
  return request("/auth/me")
}


// ─── Departments ──────────────────────────────────────────────────────────────

export interface Department {
  department_id: number
  department_name: string
}

export async function apiGetDepartments(): Promise<Department[]> {
  return request<Department[]>("/tickets/departments")
}


// ─── Tickets ──────────────────────────────────────────────────────────────────

export type BackendStatus = "open" | "in_progress" | "resolved" | "closed" | "merged"
export type FrontendStatus = "open" | "in-progress" | "resolved"

export interface ApiTicket {
  ticket_id: number
  user_id: number
  department_id: number
  description: string
  status: BackendStatus
  priority: number
  created_at: string
  resolved_at?: string | null
}

/** Normalise backend status strings to the 3-value set the frontend uses. */
export function normaliseStatus(status: BackendStatus): FrontendStatus {
  if (status === "in_progress") return "in-progress"
  if (status === "closed" || status === "merged") return "resolved"
  return status as FrontendStatus
}

/** Convert a frontend status back to a backend status for PATCH calls. */
export function toBackendStatus(status: FrontendStatus): BackendStatus {
  if (status === "in-progress") return "in_progress"
  return status
}

export async function apiGetMyTickets(): Promise<ApiTicket[]> {
  return request<ApiTicket[]>("/tickets/my-tickets")
}

export async function apiGetAllTickets(): Promise<ApiTicket[]> {
  return request<ApiTicket[]>("/tickets/")
}

export async function apiSubmitTicket(
  department_id: number,
  description: string,
  priority: number = 5
): Promise<{ ticket_id: number }> {
  return request("/tickets/submit", {
    method: "POST",
    body: JSON.stringify({ department_id, description, priority }),
  })
}

export async function apiUpdateTicketStatus(
  ticket_id: number,
  status: string
): Promise<{ ticket_id: number; status: string }> {
  return request(`/tickets/${ticket_id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export interface ApiTicketDetail extends ApiTicket {
  conversation_history: Array<{
    message_id: number
    sender_id: number
    message_body: string
    created_at: string
  }>
}

export async function apiGetTicket(ticket_id: number): Promise<ApiTicketDetail> {
  return request<ApiTicketDetail>(`/tickets/${ticket_id}`)
}

export async function apiGetMessages(ticket_id: number) {
  return request<
    Array<{
      message_id: number
      sender_id: number
      message_body: string
      created_at: string
    }>
  >(`/tickets/${ticket_id}/messages`)
}

export async function apiSendMessage(
  ticket_id: number,
  message_body: string
): Promise<{ message_id: number }> {
  return request(`/tickets/${ticket_id}/messages`, {
    method: "POST",
    body: JSON.stringify({ message_body }),
  })
}


// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportSummary {
  total_tickets: number
  resolved_tickets: number
  open_tickets: number
  avg_resolution_time_hours: number
  monthly_resolution_rate: number
}

export interface DepartmentReport {
  department_name: string
  total_assigned: number
  resolved_count: number
  unresolved_count: number
  monthly_success_rate: number
}

export async function apiGetReportSummary(): Promise<ReportSummary> {
  return request<ReportSummary>("/reports/summary")
}

export async function apiGetDepartmentReport(): Promise<DepartmentReport[]> {
  return request<DepartmentReport[]>("/reports/by-department")
}