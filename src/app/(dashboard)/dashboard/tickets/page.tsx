"use client";
// src/app/(dashboard)/dashboard/tickets/page.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  sector: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  reportedBy: { id: string; name: string; image: string | null };
  assignedTo: { id: string; name: string; image: string | null } | null;
  _count: { comments: number };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  OPEN:        { label: "Ouvert",      color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6", icon: "🟢" },
  IN_PROGRESS: { label: "En cours",    color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B", icon: "🔄" },
  ON_HOLD:     { label: "En attente",  color: "#94A3B8", bg: "#F8FAFC", dot: "#CBD5E1", icon: "⏸️" },
  RESOLVED:    { label: "Résolu",      color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E", icon: "✅" },
  CLOSED:      { label: "Fermé",       color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8", icon: "🔒" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  LOW:      { label: "Faible",    color: "#94A3B8", icon: "▽" },
  MEDIUM:   { label: "Moyenne",   color: "#F59E0B", icon: "◈" },
  HIGH:     { label: "Haute",     color: "#EA580C", icon: "▲" },
  CRITICAL: { label: "Critique",  color: "#DC2626", icon: "🔥" },
};

const SECTOR_LABELS: Record<string, string> = {
  REAL_ESTATE: "🏢 Immobilier",
  VEHICLE: "🚗 Véhicule",
  HOSPITALITY: "🏨 Hôtellerie",
  EQUIPMENT: "🔧 Équipement",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  if (minutes > 0) return `il y a ${minutes}min`;
  return "à l'instant";
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Composants ───────────────────────────────────────────────────────────────

function Avatar({ name, image, size = "sm" }: { name: string; image?: string | null; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover`} />;
  return (
    <div className={`${sz} rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-600 flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"open" | "all">("open");

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", statusFilter, priorityFilter, search, view],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (search) params.set("search", search);
      if (view === "open") params.set("status", "OPEN");
      params.set("limit", "50");
      const res = await fetch(`/api/v1/tickets?${params}`);
      if (!res.ok) throw new Error("Erreur");
      return res.json() as Promise<{ data: Ticket[]; meta: { total: number } }>;
    },
    staleTime: 30_000,
  });

  const tickets = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
            <p className="text-sm text-slate-400 mt-0.5">Support & réclamations</p>
          </div>
          <Link
            href="/dashboard/tickets/new"
            className="flex items-center gap-2 h-9 px-4 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            + Nouveau ticket
          </Link>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filtres */}
          <aside className="w-48 flex-shrink-0 space-y-6">
            {/* Statut rapide */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Vue</p>
              <div className="space-y-1">
                {[
                  { value: "open", label: "Ouverts", icon: "🟢" },
                  { value: "all", label: "Tous", icon: "📋" },
                ].map((v) => (
                  <button
                    key={v.value}
                    onClick={() => { setView(v.value as "open" | "all"); setStatusFilter(""); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      view === v.value ? "bg-orange-50 text-orange-600 font-medium" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{v.icon}</span> {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre statut */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Statut</p>
              <div className="space-y-1">
                <button
                  onClick={() => { setStatusFilter(""); setView("all"); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    !statusFilter && view === "all" ? "bg-orange-50 text-orange-600 font-medium" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Tous
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => { setStatusFilter(key); setView("all"); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      statusFilter === key ? "bg-orange-50 text-orange-600 font-medium" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre priorité */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Priorité</p>
              <div className="space-y-1">
                <button
                  onClick={() => setPriorityFilter("")}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    !priorityFilter ? "bg-orange-50 text-orange-600 font-medium" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Toutes
                </button>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setPriorityFilter(key)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      priorityFilter === key ? "bg-orange-50 text-orange-600 font-medium" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Liste tickets */}
          <div className="flex-1 min-w-0">
            {/* Barre recherche */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un ticket..."
                className="w-full h-9 pl-9 pr-4 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Compteur */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-800">{total}</span> ticket{total !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Tickets */}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
                <p className="text-4xl mb-3">🎫</p>
                <p className="text-sm font-medium text-slate-700">Aucun ticket</p>
                <Link href="/dashboard/tickets/new" className="text-xs text-orange-600 hover:underline mt-2 inline-block">
                  Créer le premier ticket →
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    {/* Indicateur priorité */}
                    <div
                      className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: PRIORITY_CONFIG[ticket.priority]?.color ?? "#94A3B8" }}
                    />

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                          {ticket.title}
                        </p>
                        {ticket.sector && (
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {SECTOR_LABELS[ticket.sector]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mb-2">{ticket.body}</p>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={ticket.status} />
                        <span className="text-xs text-slate-400">
                          #{ticket.id.slice(-6)} · ouvert {timeAgo(ticket.createdAt)} par{" "}
                          <span className="font-medium">{ticket.reportedBy.name}</span>
                        </span>
                        {ticket._count.comments > 0 && (
                          <span className="text-xs text-slate-400">
                            💬 {ticket._count.comments}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Assigné */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={ticket.assignedTo.name} image={ticket.assignedTo.image} />
                          <span className="text-xs text-slate-500 hidden lg:block">{ticket.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">Non assigné</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}