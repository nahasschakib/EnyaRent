"use client";
// src/app/(portal)/portal/page.tsx

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface PortalDashboardData {
  customer: {
    name: string;
    email: string;
    score: string | null;
  } | null;
  activeBookings: number;
  pendingPayments: number;
  totalPaid: number;
  openTickets: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
  recentBookings: {
    id: string;
    assetName: string;
    sector: string;
    startDate: string;
    endDate: string;
    status: string;
    totalAmount: number;
  }[];
  recentPayments: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    type: string;
  }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "En attente", color: "#D97706", bg: "#FFFBEB" },
  CONFIRMED: { label: "Confirmée", color: "#2563EB", bg: "#EFF6FF" },
  ACTIVE: { label: "Active", color: "#EA580C", bg: "#FFF7ED" },
  COMPLETED: { label: "Terminée", color: "#16A34A", bg: "#F0FDF4" },
  CANCELLED: { label: "Annulée", color: "#94A3B8", bg: "#F8FAFC" },
};

const SECTOR_ICONS: Record<string, string> = {
  REAL_ESTATE: "🏢", VEHICLE: "🚗", HOSPITALITY: "🏨", EQUIPMENT: "🔧",
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} MAD`;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

export default function PortalDashboardPage() {
  const { data, isLoading } = useQuery<PortalDashboardData>({
    queryKey: ["portal-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/v1/portal/dashboard");
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
    staleTime: 30_000,
  });

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-400">{greeting} 👋</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Mon espace</h1>
        <p className="text-sm text-slate-400 mt-1">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Alerte paiement dû */}
      {!isLoading && data?.nextDueAmount && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💳</span>
            <div>
              <p className="text-sm font-semibold text-orange-700">Paiement à venir</p>
              <p className="text-xs text-orange-500">
                {formatAmount(data.nextDueAmount)} — échéance le {data.nextDueDate ? formatDate(data.nextDueDate) : "—"}
              </p>
            </div>
          </div>
          <Link
            href="/portal/payments"
            className="text-xs font-medium text-orange-700 border border-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
          >
            Payer maintenant →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <p className="text-xs font-medium text-orange-200 uppercase tracking-wide mb-2">Réservations actives</p>
              <p className="text-3xl font-bold">{data?.activeBookings ?? 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Total payé</p>
              <p className="text-xl font-bold text-slate-900">{formatAmount(data?.totalPaid ?? 0)}</p>
            </div>
            <div className={`rounded-xl p-4 ${(data?.pendingPayments ?? 0) > 0 ? "bg-red-50 border border-red-200" : "bg-white border border-slate-200"}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${(data?.pendingPayments ?? 0) > 0 ? "text-red-500" : "text-slate-500"}`}>
                Paiements en attente
              </p>
              <p className={`text-3xl font-bold ${(data?.pendingPayments ?? 0) > 0 ? "text-red-600" : "text-slate-900"}`}>
                {data?.pendingPayments ?? 0}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Demandes ouvertes</p>
              <p className="text-3xl font-bold text-slate-900">{data?.openTickets ?? 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/portal/bookings", icon: "📅", label: "Réservations" },
          { href: "/portal/payments", icon: "💳", label: "Paiements" },
          { href: "/portal/documents", icon: "📄", label: "Documents" },
          { href: "/portal/tickets/new", icon: "✉️", label: "Nouvelle demande" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-md hover:border-orange-200 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Réservations récentes */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Mes réservations récentes</h2>
          <Link href="/portal/bookings" className="text-xs text-orange-600 hover:underline">Tout voir →</Link>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (data?.recentBookings.length ?? 0) === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">Aucune réservation pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data?.recentBookings.map((booking) => {
              const status = STATUS_LABELS[booking.status] ?? STATUS_LABELS.PENDING;
              return (
                <Link
                  key={booking.id}
                  href={`/portal/bookings/${booking.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-2xl">{SECTOR_ICONS[booking.sector] ?? "🏠"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{booking.assetName}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      {status.label}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{formatAmount(booking.totalAmount)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Paiements récents */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Historique paiements</h2>
          <Link href="/portal/payments" className="text-xs text-orange-600 hover:underline">Tout voir →</Link>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (data?.recentPayments.length ?? 0) === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">Aucun paiement enregistré</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data?.recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm text-slate-700">{payment.type === "RENT" ? "Loyer / Réservation" : "Caution"}</p>
                  <p className="text-xs text-slate-400">{formatDate(payment.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatAmount(payment.amount)}</p>
                  <p className={`text-xs ${payment.status === "COMPLETED" ? "text-green-600" : payment.status === "PENDING" ? "text-orange-500" : "text-red-500"}`}>
                    {payment.status === "COMPLETED" ? "Payé" : payment.status === "PENDING" ? "En attente" : "Échoué"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}