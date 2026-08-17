"use client";
// src/app/(portal)/portal/tickets/page.tsx

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: "Ouvert",      color: "#2563EB", bg: "#EFF6FF" },
  IN_PROGRESS: { label: "En cours",    color: "#EA580C", bg: "#FFF7ED" },
  RESOLVED:    { label: "Résolu",      color: "#16A34A", bg: "#F0FDF4" },
  CLOSED:      { label: "Fermé",       color: "#94A3B8", bg: "#F8FAFC" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: "Faible",  color: "#94A3B8" },
  MEDIUM: { label: "Moyenne", color: "#F59E0B" },
  HIGH:   { label: "Haute",   color: "#EA580C" },
};

export default function PortalTicketsPage() {
  const { data, isLoading } = useQuery<{ data: Ticket[] }>({
    queryKey: ["portal-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/v1/portal/tickets");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  const tickets = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes tickets</h1>
          <p className="text-sm text-slate-400 mt-1">Suivez vos demandes et réclamations</p>
        </div>
        <Link
          href="/portal/tickets/new"
          className="h-9 px-4 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          + Nouvelle demande
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">🎫</p>
          <p className="text-sm font-medium text-slate-700">Aucun ticket</p>
          <p className="text-xs text-slate-400 mt-1">Créez une demande si vous avez besoin d&apos;aide</p>
          <Link
            href="/portal/tickets/new"
            className="mt-4 inline-block text-sm text-orange-600 font-medium hover:underline"
          >
            Créer un ticket →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
            const priority = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.MEDIUM;
            return (
              <div
                key={ticket.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: priority.color }}
                    />
                    <p className="text-sm font-medium text-slate-900 truncate">{ticket.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
