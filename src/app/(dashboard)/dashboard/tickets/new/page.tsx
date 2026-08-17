"use client";
// src/app/(dashboard)/dashboard/tickets/new/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const PRIORITIES = [
  { value: "LOW", label: "Faible", color: "#94A3B8", icon: "▽" },
  { value: "MEDIUM", label: "Moyenne", color: "#F59E0B", icon: "◈" },
  { value: "HIGH", label: "Haute", color: "#EA580C", icon: "▲" },
  { value: "CRITICAL", label: "Critique", color: "#DC2626", icon: "🔥" },
];

const SECTORS = [
  { value: "none", label: "Tous secteurs" },
  { value: "REAL_ESTATE", label: "🏢 Immobilier" },
  { value: "VEHICLE", label: "🚗 Véhicule" },
  { value: "HOSPITALITY", label: "🏨 Hôtellerie" },
  { value: "EQUIPMENT", label: "🔧 Équipement" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [sector, setSector] = useState("");

  const createTicket = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          priority,
          ...(sector && { sector }),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur création");
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      router.push(`/dashboard/tickets/${ticket.id}`);
    },
  });

  const isValid = title.length >= 5 && body.length >= 10;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"
        >
          ← Tickets
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Nouveau ticket</h1>
          <p className="text-sm text-slate-400 mt-1">Signalez un problème ou faites une demande</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-6 space-y-5">

            {/* Titre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Titre <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Décrivez le problème en une ligne..."
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              {title.length > 0 && title.length < 5 && (
                <p className="text-xs text-red-500">Au moins 5 caractères</p>
              )}
            </div>

            {/* Priorité + Secteur */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Priorité</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        priority === p.value
                          ? "border-current font-semibold"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                      style={priority === p.value ? { color: p.color, backgroundColor: `${p.color}12`, borderColor: p.color } : {}}
                    >
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Secteur concerné</label>
                <Select value={sector || "none"} onValueChange={(value: string) => setSector(value==="none" ? "" : value)}>
                  <SelectTrigger className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Description <span className="text-orange-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Décrivez le problème en détail : quand, où, quelle erreur, étapes pour reproduire..."
                rows={6}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y"
              />
              <p className="text-xs text-slate-400 text-right">{body.length} caractères</p>
            </div>

            {createTicket.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                ⚠️ {createTicket.error?.message}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-9 px-4 border border-slate-200 text-slate-500 text-sm rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => createTicket.mutate()}
              disabled={!isValid || createTicket.isPending}
              className="h-9 px-5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {createTicket.isPending ? "⏳ Création..." : "✓ Créer le ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}