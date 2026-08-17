"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface HotelCheckinFormProps {
  bookingId: string;
  checkinTime: string;
  checkoutTime: string;
  pricePerNight: number;
  nights: number;
  onSuccess?: () => void;
}

const SUPPLEMENTS_OPTIONS = [
  { code: "breakfast", label: "Petit-déjeuner", amount: 120 },
  { code: "parking", label: "Parking privé", amount: 80 },
  { code: "airport_transfer", label: "Transfert aéroport", amount: 350 },
  { code: "wifi_premium", label: "Wi-Fi premium", amount: 50 },
  { code: "minibar", label: "Minibar", amount: 200 },
  { code: "spa", label: "Accès spa", amount: 150 },
];

export function HotelCheckinForm({ bookingId, checkinTime, checkoutTime, pricePerNight, nights, onSuccess }: HotelCheckinFormProps) {
  const queryClient = useQueryClient();
  const [guestName, setGuestName] = useState("");
  const [guestId, setGuestId] = useState("");
  const [actualTime, setActualTime] = useState(new Date().toISOString().slice(0, 16));
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const toggleSupplement = (code: string) =>
    setSelectedSupplements((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );

  const supplements = SUPPLEMENTS_OPTIONS.filter((s) => selectedSupplements.includes(s.code))
    .map((s) => ({ ...s, nights }));

  const supplementsTotal = supplements.reduce((sum, s) => sum + s.amount * s.nights, 0);
  const total = pricePerNight * nights + supplementsTotal;

  const checkin = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualCheckinTime: new Date(actualTime).toISOString(),
          guestName,
          guestIdNumber: guestId || undefined,
          supplements,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      onSuccess?.();
    },
  });

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
        <span>🏨</span>
        <span>Check-in prévu à <strong>{checkinTime}</strong> · Check-out prévu à <strong>{checkoutTime}</strong> · Durée : <strong>{nights} nuit(s)</strong></span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Nom du client <span className="text-orange-500">*</span></label>
          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
            placeholder="Nom complet..."
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">CIN / Passeport</label>
          <input type="text" value={guestId} onChange={(e) => setGuestId(e.target.value)}
            placeholder="N° pièce identité..."
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Heure d&apos;arrivée réelle</label>
        <input type="datetime-local" value={actualTime} onChange={(e) => setActualTime(e.target.value)}
          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Suppléments</label>
        <div className="grid grid-cols-2 gap-2">
          {SUPPLEMENTS_OPTIONS.map((s) => (
            <button key={s.code} type="button" onClick={() => toggleSupplement(s.code)}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all ${
                selectedSupplements.includes(s.code)
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}>
              <span>{s.label}</span>
              <span className="text-xs font-semibold">{s.amount} MAD/nuit</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{nights} nuit(s) × {pricePerNight.toLocaleString("fr-FR")} MAD</span>
          <span className="font-semibold">{(pricePerNight * nights).toLocaleString("fr-FR")} MAD</span>
        </div>
        {supplements.map((s) => (
          <div key={s.code} className="flex justify-between text-sm">
            <span className="text-slate-600">{s.label} × {nights} nuits</span>
            <span className="font-semibold">{(s.amount * nights).toLocaleString("fr-FR")} MAD</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
          <span>Total séjour</span>
          <span className="text-orange-600">{total.toLocaleString("fr-FR")} MAD</span>
        </div>
      </div>

      {checkin.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {checkin.error?.message}
        </div>
      )}

      <button
        onClick={() => checkin.mutate()}
        disabled={!guestName || checkin.isPending}
        className="w-full h-10 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {checkin.isPending ? "⏳ Enregistrement..." : "🏨 Enregistrer le check-in"}
      </button>
    </div>
  );
}
