"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface VehicleReturnFormProps {
  bookingId: string;
  kmDepart: number;
  kmForfait?: number;
  extraKmRate?: number;
  onSuccess?: (result: { kmResult: { kmDepassement: number; fraisDepassement: number } }) => void;
}

export function VehicleReturnForm({
  bookingId, kmDepart, kmForfait = 200, extraKmRate = 0, onSuccess,
}: VehicleReturnFormProps) {
  const queryClient = useQueryClient();
  const [kmRetour, setKmRetour] = useState("");
  const [notes, setNotes] = useState("");

  const km = parseFloat(kmRetour) || 0;
  const parcourus = km > kmDepart ? km - kmDepart : 0;
  const depassement = Math.max(0, parcourus - kmForfait);
  const frais = depassement * extraKmRate;

  const submitReturn = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}/return-km`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kmRetour: km, kmForfait, notes }),
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
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 flex items-start gap-2">
        <span>🚗</span>
        <span>Km de départ enregistré : <strong>{kmDepart.toLocaleString("fr-FR")} km</strong> · Forfait inclus : <strong>{kmForfait.toLocaleString("fr-FR")} km</strong></span>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Kilométrage au retour <span className="text-orange-500">*</span></label>
        <input
          type="number"
          value={kmRetour}
          onChange={(e) => setKmRetour(e.target.value)}
          placeholder={String(kmDepart + 100)}
          min={kmDepart}
          className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
      </div>

      {km > kmDepart && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Km parcourus</span>
            <span className="font-semibold">{parcourus.toLocaleString("fr-FR")} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Km forfait</span>
            <span className="font-semibold">{kmForfait.toLocaleString("fr-FR")} km</span>
          </div>
          <div className={`flex justify-between text-sm border-t border-slate-200 pt-2 ${depassement > 0 ? "text-red-600" : "text-green-600"}`}>
            <span className="font-medium">Km dépassement</span>
            <span className="font-bold">{depassement.toLocaleString("fr-FR")} km</span>
          </div>
          {depassement > 0 && extraKmRate > 0 && (
            <div className="flex justify-between text-sm bg-red-50 rounded-lg px-3 py-2">
              <span className="text-red-700 font-medium">Frais supplémentaires</span>
              <span className="text-red-700 font-bold">{frais.toLocaleString("fr-FR")} MAD</span>
            </div>
          )}
          {depassement === 0 && (
            <p className="text-xs text-green-600 font-medium">✅ Dans le forfait — aucun frais supplémentaire</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Observations (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="État du véhicule au retour, remarques..."
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
        />
      </div>

      {submitReturn.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {submitReturn.error?.message}
        </div>
      )}

      <button
        onClick={() => submitReturn.mutate()}
        disabled={!kmRetour || km <= kmDepart || submitReturn.isPending}
        className="w-full h-10 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {submitReturn.isPending ? "⏳ Enregistrement..." : "✓ Enregistrer le retour"}
      </button>
    </div>
  );
}
