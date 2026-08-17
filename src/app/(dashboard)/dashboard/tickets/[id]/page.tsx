"use client";
// src/app/(dashboard)/dashboard/tickets/[id]/page.tsx

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
  attachments: string[];
}

interface ActivityItem {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string };
  metadata: Record<string, unknown>;
}

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
  reportedBy: { id: string; name: string; image: string | null; email: string };
  assignedTo: { id: string; name: string; image: string | null } | null;
  comments: Comment[];
  activity: ActivityItem[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUSES = [
  { value: "OPEN", label: "Ouvert", color: "#2563EB" },
  { value: "IN_PROGRESS", label: "En cours", color: "#D97706" },
  { value: "ON_HOLD", label: "En attente", color: "#94A3B8" },
  { value: "RESOLVED", label: "Résolu", color: "#16A34A" },
  { value: "CLOSED", label: "Fermé", color: "#64748B" },
];

const PRIORITIES = [
  { value: "LOW", label: "Faible", color: "#94A3B8" },
  { value: "MEDIUM", label: "Moyenne", color: "#F59E0B" },
  { value: "HIGH", label: "Haute", color: "#EA580C" },
  { value: "CRITICAL", label: "Critique", color: "#DC2626" },
];

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert", IN_PROGRESS: "En cours", ON_HOLD: "En attente",
  RESOLVED: "Résolu", CLOSED: "Fermé",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Faible", MEDIUM: "Moyenne", HIGH: "Haute", CRITICAL: "Critique",
};

const ACTIVITY_MESSAGES: Record<string, (m: Record<string, unknown>, userName: string) => string> = {
  CREATED: (_, u) => `${u} a ouvert ce ticket`,
  STATUS_CHANGED: (m, u) => `${u} a changé le statut : ${STATUS_LABELS[m.from as string]} → ${STATUS_LABELS[m.to as string]}`,
  PRIORITY_CHANGED: (m, u) => `${u} a changé la priorité : ${PRIORITY_LABELS[m.from as string]} → ${PRIORITY_LABELS[m.to as string]}`,
  ASSIGNED: (m, u) => `${u} a assigné ce ticket`,
  UNASSIGNED: (_, u) => `${u} a retiré l'assignation`,
  COMMENTED: (_, u) => `${u} a commenté`,
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  if (hours > 0) return `il y a ${hours}h`;
  if (minutes > 0) return `il y a ${minutes}min`;
  return "à l'instant";
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, image, size = "md" }: { name: string; image?: string | null; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-600 flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tickets/${id}`);
      if (!res.ok) throw new Error("Ticket introuvable");
      return res.json();
    },
  });

  const updateTicket = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch(`/api/v1/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket", id] }),
  });

  const addComment = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment }),
      });
      if (res.ok) {
        setComment("");
        queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!ticket) return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center">
      <p className="text-4xl mb-3">❌</p>
      <p className="text-sm text-slate-500">Ticket introuvable</p>
    </div>
  );

  const currentStatus = STATUSES.find((s) => s.value === ticket.status);
  const currentPriority = PRIORITIES.find((p) => p.value === ticket.priority);

  // Merge commentaires + activité dans une timeline unifiée
  const timeline = [
    ...ticket.comments.map((c) => ({ type: "comment" as const, date: c.createdAt, data: c })),
    ...ticket.activity.filter((a) => a.action !== "COMMENTED").map((a) => ({ type: "activity" as const, date: a.createdAt, data: a })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600 mb-3 flex items-center gap-1">
            ← Tickets
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: currentStatus?.color, backgroundColor: `${currentStatus?.color}15` }}
                >
                  {currentStatus?.label}
                </span>
                <span className="text-xs text-slate-400">#{ticket.id.slice(-8)}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Ouvert {timeAgo(ticket.createdAt)} par <span className="font-medium">{ticket.reportedBy.name}</span>
                {" · "}{ticket.comments.length} commentaire{ticket.comments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Zone principale — description + timeline */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Description originale */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <Avatar name={ticket.reportedBy.name} image={ticket.reportedBy.image} />
                <div>
                  <span className="text-sm font-medium text-slate-800">{ticket.reportedBy.name}</span>
                  <span className="text-xs text-slate-400 ml-2">a ouvert ce ticket {timeAgo(ticket.createdAt)}</span>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.body}</p>
              </div>
            </div>

            {/* Timeline unifiée */}
            {timeline.map((item) => {
              if (item.type === "comment") {
                const c = item.data as Comment;
                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <Avatar name={c.author.name} image={c.author.image} />
                      <div>
                        <span className="text-sm font-medium text-slate-800">{c.author.name}</span>
                        <span className="text-xs text-slate-400 ml-2">{timeAgo(c.createdAt)}</span>
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                );
              } else {
                const a = item.data as ActivityItem;
                const msg = ACTIVITY_MESSAGES[a.action];
                return (
                  <div key={a.id} className="flex items-center gap-3 px-2 py-1">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 flex-shrink-0">
                      {a.action === "STATUS_CHANGED" ? "◈" : a.action === "ASSIGNED" ? "👤" : "·"}
                    </div>
                    <p className="text-xs text-slate-500">
                      {msg ? msg(a.metadata, a.user.name) : a.action}
                      <span className="ml-2 text-slate-400">{timeAgo(a.createdAt)}</span>
                    </p>
                  </div>
                );
              }
            })}

            {/* Zone de commentaire */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-600">Ajouter un commentaire</p>
              </div>
              <div className="p-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Écrivez votre réponse... Utilisez @nom pour mentionner quelqu'un."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={addComment}
                    disabled={!comment.trim() || isSubmitting}
                    className="h-9 px-5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {isSubmitting ? "⏳ Envoi..." : "💬 Commenter"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar droite — infos + actions */}
          <aside className="w-56 flex-shrink-0 space-y-4">

            {/* Statut */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Statut</p>
              <div className="space-y-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateTicket.mutate({ status: s.value })}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      ticket.status === s.value
                        ? "font-semibold"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                    style={ticket.status === s.value ? { color: s.color, backgroundColor: `${s.color}12` } : {}}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    {s.label}
                    {ticket.status === s.value && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Priorité */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Priorité</p>
              <div className="space-y-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => updateTicket.mutate({ priority: p.value })}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      ticket.priority === p.value ? "font-semibold" : "text-slate-500 hover:bg-slate-50"
                    }`}
                    style={ticket.priority === p.value ? { color: p.color, backgroundColor: `${p.color}12` } : {}}
                  >
                    <span className="text-xs" style={{ color: p.color }}>
                      {p.value === "LOW" ? "▽" : p.value === "MEDIUM" ? "◈" : p.value === "HIGH" ? "▲" : "🔥"}
                    </span>
                    {p.label}
                    {ticket.priority === p.value && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Créateur */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Créé par</p>
              <div className="flex items-center gap-2">
                <Avatar name={ticket.reportedBy.name} image={ticket.reportedBy.image} size="sm" />
                <div>
                  <p className="text-xs font-medium text-slate-800">{ticket.reportedBy.name}</p>
                  <p className="text-[10px] text-slate-400">{timeAgo(ticket.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Assigné */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigné à</p>
              {ticket.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar name={ticket.assignedTo.name} image={ticket.assignedTo.image} size="sm" />
                  <p className="text-xs font-medium text-slate-800">{ticket.assignedTo.name}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Non assigné</p>
              )}
            </div>

            {/* Actions rapides */}
            {ticket.status !== "CLOSED" && (
              <button
                onClick={() => updateTicket.mutate({ status: "CLOSED" })}
                className="w-full h-9 border border-slate-200 text-slate-500 text-xs font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                🔒 Fermer le ticket
              </button>
            )}
            {ticket.status === "CLOSED" && (
              <button
                onClick={() => updateTicket.mutate({ status: "OPEN" })}
                className="w-full h-9 border border-slate-200 text-slate-500 text-xs font-medium rounded-lg hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors"
              >
                🔓 Rouvrir le ticket
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}