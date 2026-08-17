"use client";
// src/app/(portal)/portal/bookings/page.tsx

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Booking {
  id: string;
  assetName: string;
  assetCity: string;
  sector: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  depositAmount: number | null;
  contractId: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDING:   { label: "En attente",  color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  CONFIRMED: { label: "Confirmée",   color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  ACTIVE:    { label: "Active",      color: "#EA580C", bg: "#FFF7ED", dot: "#EA580C" },
  COMPLETED: { label: "Terminée",    color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" },
  CANCELLED: { label: "Annulée",     color: "#94A3B8", bg: "#F8FAFC", dot: "#CBD5E1" },
};

const SECTOR_ICONS: Record<string, string> = {
  REAL_ESTATE: "🏢", VEHICLE: "🚗", HOSPITALITY: "🏨", EQUIPMENT: "🔧",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function PortalBookingsPage() {
  const { data, isLoading } = useQuery<{ data: Booking[] }>({
    queryKey: ["portal-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/portal/bookings");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  const bookings = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes réservations</h1>
        <p className="text-sm text-slate-400 mt-1">Historique complet de vos locations</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm font-medium text-slate-700">Aucune réservation</p>
          <p className="text-xs text-slate-400 mt-1">Vos réservations apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;
            return (
              <Link
                key={booking.id}
                href={`/portal/bookings/${booking.id}`}
                className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-orange-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      {SECTOR_ICONS[booking.sector] ?? "🏠"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{booking.assetName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{booking.assetCity}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                      {status.label}
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {Number(booking.totalAmount).toLocaleString("fr-FR")} MAD
                    </p>
                    {booking.contractId && (
                      <p className="text-xs text-orange-600 mt-1">📄 Contrat disponible</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}