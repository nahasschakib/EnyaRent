"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EquipmentInspectionFormProps {
  bookingId: string;
  type: "ENTRY" | "EXIT";
  replacementValue: number;
  depositAmount: number;
  entryCondition?: string;
  onSuccess?: (result: { depositResolution?: { refundAmount: number; totalDeducted: number } }) => void;
}

const CONDITIONS = [
  { value: "NEW", label: "Neuf", color: "#16A34A" },
  { value: "GOOD", label: "Très bon état", color: "#2563EB" },
  { value: "FAIR", label: "Bon état", color: "#D97706" },
  { value: "POOR", label: "Correct", color: "#DC2626" },
];

export function EquipmentInspectionForm({
  bookingId, type, replacementValue, depositAmount, entryCondition, onSuccess,
}: EquipmentInspectionFormProps) {
  const queryClient = useQueryClient();
  const [condition, setCondition] = useState(entryCondition ?? "GOOD");
  const [notes, setNotes] = useState("");
  const [extraDeductions, setExtraDeductions] = useState<{ reason: string; amount: string }[]>([]);

  const addDeduction = () => setExtraDeductions((prev) => [...prev, { reason: "", amount: "" }]);
  const removeDeduction = (i: number) => setExtraDeductions((prev) => prev.filter((_, idx) => idx !== i));

  const submitInspection = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          condition,
          notes: notes || undefined,
          photos: [],
          signedBy: { name: "Gestionnaire", role: "MANAGER" },
          extraDeductions: extraDeductions
            .filter((d) => d.reason && d.amount)
            .map((d) => ({ reason: d.reason, amount: parseFloat(d.amount) })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      onSuccess?.(data);
    },
  });

  return (
    <div className="space-y-4">
      <div className={`border rounded-lg p-3 text-xs flex items-start gap-2 ${type === "ENTRY" ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}>
        <span>{type === "ENTRY" ? "📋" : "🔍"}</span>
        <span>
          {type === "ENTRY" ? "État des lieux d'entrée — avant remise du matériel" : "État des lieux de sortie — comparaison avec l'état d'entrée"}
          {type === "EXIT" && entryCondition && ` · État d'entrée : ${CONDITIONS.find((c) => c.value === entryCondition)?.label}`}
        </span>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">État du matériel <span className="text-orange-500">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((c) => (
            <button key={c.value} type="button" onClick={() => setCondition(c.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                condition === c.value ? "border-current font-bold" : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
              style={condition === c.value ? { color: c.color, backgroundColor: `${c.color}12`, borderColor: c.color } : {}}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Observations</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Décrivez l'état du matériel, anomalies constatées..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none" />
      </div>

      {type === "EXIT" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Déductions supplémentaires</label>
            <button onClick={addDeduction} type="button" className="text-xs text-orange-600 hover:underline">
              + Ajouter
            </button>
          </div>
          {extraDeductions.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input value={d.reason} onChange={(e) => {
                const copy = [...extraDeductions]; copy[i].reason = e.target.value; setExtraDeductions(copy);
              }} placeholder="Motif de déduction"
                className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
              <input value={d.amount} onChange={(e) => {
                const copy = [...extraDeductions]; copy[i].amount = e.target.value; setExtraDeductions(copy);
              }} placeholder="MAD" type="number"
                className="w-24 h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none" />
              <button onClick={() => removeDeduction(i)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
            </div>
          ))}
        </div>
      )}

      {submitInspection.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {submitInspection.error?.message}
        </div>
      )}

      <button
        onClick={() => submitInspection.mutate()}
        disabled={submitInspection.isPending}
        className="w-full h-10 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40"
      >
        {submitInspection.isPending ? "⏳ Enregistrement..." : `✓ Valider l'état des lieux ${type === "ENTRY" ? "d'entrée" : "de sortie"}`}
      </button>
    </div>
  );
}
