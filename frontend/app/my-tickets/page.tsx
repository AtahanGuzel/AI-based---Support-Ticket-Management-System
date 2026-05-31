// app/my-tickets/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiGetMyTickets, ApiTicket } from "@/lib/api";
import Link from "next/link"



// Maps backend status values to display-friendly labels and badge styles
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800" },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", className: "bg-orange-100 text-orange-700" },
  high: { label: "High", className: "bg-red-100 text-red-700" },
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    // Graceful fallback for unknown statuses
    label: status.replace(/_/g, "-"),
    className: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const label = `P${priority}`
  const className =
    priority <= 2 ? "bg-red-100 text-red-700" :
    priority <= 5 ? "bg-orange-100 text-orange-700" :
    "bg-gray-100 text-gray-600"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function TicketSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-3/4 rounded bg-gray-200" />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="h-5 w-16 rounded-full bg-gray-200" />
          <div className="h-5 w-14 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="mt-3 h-3 w-32 rounded bg-gray-200" />
    </div>
  );
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTickets() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGetMyTickets();
        if (!cancelled) setTickets(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load tickets."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTickets();
    return () => {
      cancelled = true; // Prevent state updates if component unmounts mid-fetch
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
        {!loading && !error && (
          <span className="text-sm text-gray-500">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <TicketSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tickets.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">No tickets yet.</p>
        </div>
      )}

      {/* Ticket list */}
      {!loading && !error && tickets.length > 0 && (
        <ul className="space-y-3">
{tickets.map((ticket) => (
  <li key={ticket.ticket_id}>
    <Link
      href={`/ticket/${ticket.ticket_id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono text-gray-400">
            #{ticket.ticket_id}
          </p>
          <p className="mt-1 text-sm text-gray-800 leading-snug">
            {ticket.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        {new Date(ticket.created_at).toLocaleString()}
      </p>
    </Link>
  </li>
))}
        </ul>
      )}
    </div>
  );
}