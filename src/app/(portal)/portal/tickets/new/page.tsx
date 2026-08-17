"use client";
// src/app/(portal)/portal/tickets/new/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

export default function NewTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  const createTicket = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, priority }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      router.push("/portal/tickets");
    },
  });

  const PRIORITIES = [
    { value: "LOW", label: "Faible", color: "#94A3B8" },
    { value: "MEDIUM", label: "Moyenne", color: "#F59E0B" },
    { value: "HIGH", label: "Haute", color: "#EA580C" },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle demande</h1>
        <p className="text-sm text-slate-400 mt-1">
          Décrivez votre problème ou votre demande — notre équipe vous répondra rapidement.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {/* Titre */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Titre de la demande <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Problème avec ma clé de chambre, Question sur ma facture..."
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          {title.length > 0 && title.length < 5 && (
            <p className="text-xs text-red-500">Au moins 5 caractères</p>
          )}
        </div>

        {/* Priorité */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Priorité</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  priority === p.value
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.label}
              </button>
            ))}
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
            placeholder="Décrivez votre demande en détail : quand, où, quel problème, ce que vous avez déjà essayé..."
            rows={6}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
          />
          <p className="text-xs text-slate-400">{body.length} caractères</p>
        </div>

        {createTicket.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ⚠️ Erreur : {createTicket.error?.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 px-5 rounded-lg text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => createTicket.mutate()}
            disabled={title.length < 5 || body.length < 10 || createTicket.isPending}
            className="flex-1 h-10 px-5 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {createTicket.isPending ? "⏳ Envoi..." : "✓ Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}