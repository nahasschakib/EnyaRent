"use client";
// src/app/(dashboard)/dashboard/bookings/[id]/schedule/page.tsx
// Échéancier mensuel bail immobilier — vue complète avec statuts + actions

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ScheduleLine {
  month: number;
  year: number;
  dueDate: string;
  amount: number;
  status: "PAID" | "DUE" | "LATE";
  paymentId: string | null;
}

interface ScheduleData {
  schedule: ScheduleLine[];
  stats: {
    totalMonths: number;
    paidMonths: number;
    lateMonths: number;
    dueMonths: number;
    totalPaid: number;
    totalRemaining: number;
    totalLate: number;
  };
  booking: {
    id: string;
    totalAmount: number;
    startDate: string;
    endDate: string;
    asset: { name: string; city: string };
    customer: { name: string };
  };
}

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const STATUS_CONFIG = {
  PAID:  { label: "Payé",      color: "#16A34A", bg: "#F0FDF4", icon: "✅" },
  DUE:   { label: "À payer",   color: "#2563EB", bg: "#EFF6FF", icon: "📅" },
  LATE:  { label: "En retard", color: "#DC2626", bg: "#FEF2F2", icon: "⚠️" },
};

export default function SchedulePage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showRevision, setShowRevision] = useState(false);
  const [ipcRef, setIpcRef] = useState("100");
  const [ipcNew, setIpcNew] = useState("102.5");

  const { data, isLoading } = useQuery<ScheduleData>({
    queryKey: ["schedule", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}/schedule`);
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
  });

  const applyRevision = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipcReference: parseFloat(ipcRef),
          ipcNew: parseFloat(ipcNew),
        }),
      });
      if (!res.ok) throw new Error("Erreur révision");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", bookingId] });
      setShowRevision(false);
    },
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!data) return null;

  const { schedule, stats, booking } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600 mb-3 flex items-center gap-1">
            ← Réservation
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Échéancier mensuel</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {booking.asset.name} · {booking.customer.name}
              </p>
            </div>
            <button
              onClick={() => setShowRevision(!showRevision)}
              className="flex items-center gap-2 h-9 px-4 border border-orange-200 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-50 transition-colors"
            >
              📊 Révision IPC
            </button>
          </div>
        </div>

        {/* Révision IPC */}
        {showRevision && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-orange-800 mb-4">Révision de loyer — Indice des Prix à la Consommation (IPC)</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Loyer actuel</label>
                <p className="text-lg font-bold text-slate-900">{Number(booking.totalAmount).toLocaleString("fr-FR")} MAD</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">IPC référence</label>
                <input
                  type="number"
                  value={ipcRef}
                  onChange={(e) => setIpcRef(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nouvel IPC</label>
                <input
                  type="number"
                  value={ipcNew}
                  onChange={(e) => setIpcNew(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  step="0.1"
                />
              </div>
            </div>
            {ipcRef && ipcNew && (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 mb-3">
                <span className="text-sm text-slate-600">Nouveau loyer estimé :</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.round(Number(booking.totalAmount) * parseFloat(ipcNew) / parseFloat(ipcRef)).toLocaleString("fr-FR")} MAD
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => applyRevision.mutate()}
                disabled={applyRevision.isPending}
                className="h-9 px-4 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40"
              >
                {applyRevision.isPending ? "⏳ Application..." : "✓ Appliquer la révision"}
              </button>
              <button onClick={() => setShowRevision(false)} className="h-9 px-4 border border-slate-200 text-slate-500 text-sm rounded-lg hover:bg-slate-50">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total payé", value: `${stats.totalPaid.toLocaleString("fr-FR")} MAD`, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "Mois payés", value: `${stats.paidMonths}/${stats.totalMonths}`, color: "text-slate-900", bg: "bg-white border-slate-200" },
            { label: "En retard", value: `${stats.totalLate.toLocaleString("fr-FR")} MAD`, color: stats.totalLate > 0 ? "text-red-600" : "text-slate-400", bg: stats.totalLate > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200" },
            { label: "Restant", value: `${stats.totalRemaining.toLocaleString("fr-FR")} MAD`, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          ].map((kpi) => (
            <div key={kpi.label} className={`border rounded-xl p-4 ${kpi.bg}`}>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{kpi.label}</p>
              <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Barre de progression */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Progression du bail</span>
            <span className="text-xs font-medium text-orange-600">
              {Math.round((stats.paidMonths / stats.totalMonths) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700"
              style={{ width: `${(stats.paidMonths / stats.totalMonths) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">{new Date(booking.startDate).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</span>
            <span className="text-[10px] text-slate-400">{new Date(booking.endDate).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</span>
          </div>
        </div>

        {/* Tableau échéancier */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Détail par mois</h2>
            <span className="text-xs text-slate-400">{stats.totalMonths} échéances</span>
          </div>
          <div className="divide-y divide-slate-50">
            {schedule.map((line, i) => {
              const cfg = STATUS_CONFIG[line.status];
              const isLate = line.status === "LATE";
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 px-5 py-3 ${isLate ? "bg-red-50/50" : ""}`}
                >
                  <div className="w-12 text-center">
                    <p className="text-xs font-bold text-slate-900">{MONTH_NAMES[line.month - 1]}</p>
                    <p className="text-[10px] text-slate-400">{line.year}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">
                      Échéance : {new Date(line.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm font-bold text-slate-900">{line.amount.toLocaleString("fr-FR")} MAD</p>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}