"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Props = {
  orgSlug: string;
  assetId: string;
  deposit: number | null;
};

export function BookingForm({ orgSlug, assetId, deposit }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    startDate: "",
    endDate: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.startDate || !form.endDate) {
      setError("Veuillez sélectionner les dates d'arrivée et de départ.");
      return;
    }
    if (form.endDate <= form.startDate) {
      setError("La date de départ doit être après la date d'arrivée.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/public/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug, assetId, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la réservation");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Demande envoyée !</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            L&apos;agence a reçu votre demande et vous contactera dans les plus brefs délais à{" "}
            <strong>{form.email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="Votre nom"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          placeholder="votre@email.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Téléphone</label>
        <input
          type="tel"
          placeholder="+212 6XX XXX XXX"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Date d&apos;arrivée <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Date de départ <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            min={form.startDate || new Date().toISOString().split("T")[0]}
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Message (optionnel)
        </label>
        <textarea
          placeholder="Questions, besoins particuliers..."
          rows={3}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Deposit notice */}
      {deposit && deposit > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-xs text-amber-700">
            Caution requise : <strong>{Number(deposit).toLocaleString("fr-MA")} MAD</strong>
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Envoi en cours…
          </>
        ) : (
          <>
            Envoyer la demande <ArrowRight size={15} />
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        L&apos;agence confirmera votre demande par email sous 24h.
      </p>
    </form>
  );
}
