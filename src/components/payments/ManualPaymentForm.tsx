"use client";
// src/components/payments/ManualPaymentForm.tsx
// Formulaire saisie paiement manuel pour gestionnaires (dashboard)

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

interface ManualPaymentFormProps {
  bookingId: string;
  remaining: number;
  onSuccess?: () => void;
}

type PaymentMethod = "CMI" | "MOBILE_MONEY" | "VIREMENT" | "ESPECES" | "CHEQUE";

const MANUAL_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "ESPECES", label: "Espèces", icon: "💵" },
  { value: "CHEQUE", label: "Chèque", icon: "📃" },
  { value: "VIREMENT", label: "Virement", icon: "🏦" },
  { value: "CMI", label: "TPE / Carte", icon: "💳" },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: "📱" },
];

export default function ManualPaymentForm({
  bookingId,
  remaining,
  onSuccess,
}: ManualPaymentFormProps) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>("ESPECES");
  const [amount, setAmount] = useState(String(remaining));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<"RENT" | "DEPOSIT">("RENT");

  const recordPayment = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount: parseFloat(amount),
          method,
          type,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur enregistrement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onSuccess?.();
    },
  });

  return (
    <div className="space-y-4">
      {/* Type de paiement */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Type</label>
        <div className="flex gap-2">
          {[
            { value: "RENT", label: "Loyer / Location" },
            { value: "DEPOSIT", label: "Caution" },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value as "RENT" | "DEPOSIT")}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                type === t.value
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Méthode */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Méthode de paiement</label>
        <div className="grid grid-cols-3 gap-2">
          {MANUAL_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all ${
                method === m.value
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <span className="text-lg">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Montant */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">
          Montant <span className="text-slate-400">(reste à payer : {remaining.toLocaleString("fr-FR")} MAD)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">MAD</span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={remaining}
            min={1}
            step={0.01}
            className="w-full h-10 pl-14 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Référence */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Référence (optionnel)</label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="N° chèque, référence virement, reçu..."
          className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Notes internes (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, remarques..."
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
        />
      </div>

      {recordPayment.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {recordPayment.error?.message}
        </div>
      )}

      <button
        type="button"
        onClick={() => recordPayment.mutate()}
        disabled={
          recordPayment.isPending ||
          !amount ||
          parseFloat(amount) <= 0 ||
          parseFloat(amount) > remaining
        }
        className="w-full h-11 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {recordPayment.isPending ? "⏳ Enregistrement..." : "✓ Enregistrer le paiement"}
      </button>
    </div>
  );
}
